import { PUSH } from "../shared/ipc-channels";
import { ok, err, isErr, type Result } from "../shared/types";
import { getSettingsStore } from "./settings/settings-store";
import { getWindowManager } from "./windows/window-manager";
import { getSelectionCaptureService } from "./selection/selection-capture-service";
import { getTranslationProvider } from "./translation/google-translate-provider";
import { ensureQuickTranslatePermissions } from "./permissions/macos-permissions";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeTranslateError(error: unknown): Result<never> {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.startsWith("TIMEOUT:"))
    return err("TIMEOUT", msg.replace("TIMEOUT: ", ""));
  if (msg.startsWith("NETWORK_ERROR:"))
    return err("NETWORK_ERROR", msg.replace("NETWORK_ERROR: ", ""));
  if (msg.startsWith("API_ERROR:"))
    return err("API_ERROR", msg.replace("API_ERROR: ", ""));
  return err("UNKNOWN", msg);
}

/**
 * 1) Hide quick + main windows if visible so focus returns to the app where text is selected.
 * 2) Wait briefly for macOS / Windows to restore the previous app as key window.
 * 3) Simulate Cmd+C / Ctrl+C and read clipboard — **before** showing the floating panel (always-on-top
 *    would otherwise steal focus and break selection).
 * 4) Show the panel only for loading (translate API) or error/result.
 */
export async function runQuickTranslatePipeline(): Promise<Result<void>> {
  const wm = getWindowManager();
  const quickWin = wm.getQuickWindow();
  if (!quickWin) {
    return err("POPUP_NOT_READY", "Quick window is not initialized");
  }

  const settings = getSettingsStore();
  const s = settings.get();

  if (process.platform === "darwin") {
    const permission = await ensureQuickTranslatePermissions();
    if (!permission.ok) {
      quickWin.webContents.send(PUSH.QUICK_ERROR, permission.message);
      wm.showQuick(s.popupAlwaysOnTop);
      return err("SELECTION_CAPTURE_FAILED", permission.message);
    }
  }

  const mainWin = wm.getMainWindow();
  if (mainWin?.isVisible() && mainWin.isFocused()) {
    mainWin.hide();
  }
  if (quickWin.isVisible()) {
    quickWin.hide();
  }
  await delay(280);

  const capture = getSelectionCaptureService();
  const provider = getTranslationProvider();

  let text: string;
  try {
    text = await capture.captureSelectedText({
      delayMs: s.autoCopyDelayMs,
      restoreClipboard: s.restoreClipboard,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const clean = msg.replace("SELECTION_CAPTURE_FAILED: ", "");
    quickWin.webContents.send(PUSH.QUICK_ERROR, clean);
    wm.showQuick(s.popupAlwaysOnTop);
    return err("SELECTION_CAPTURE_FAILED", clean);
  }

  quickWin.webContents.send(PUSH.QUICK_LOADING);
  wm.showQuick(s.popupAlwaysOnTop);

  try {
    const result = await provider.translate({
      source: "auto",
      target: s.quickTargetLanguage,
      text,
    });
    quickWin.webContents.send(PUSH.QUICK_SHOW, {
      original: text,
      translated: result.translation,
      source: result.source,
      target: result.target,
    });
    return ok(undefined);
  } catch (error: unknown) {
    const r = normalizeTranslateError(error);
    if (isErr(r)) {
      quickWin.webContents.send(PUSH.QUICK_ERROR, r.error.message);
    }
    return r;
  }
}
