import { shell, systemPreferences } from "electron";
import { execFile } from "node:child_process";

type MacPrivacyPane = "accessibility" | "automation";

function execFileAsync(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(command, args, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function isAutomationDeniedError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  const normalized = msg.toLowerCase();
  return (
    normalized.includes("-1743") ||
    normalized.includes("not authorized") ||
    normalized.includes("not permitted") ||
    normalized.includes("automation")
  );
}

export function requestAccessibilityPermission(): boolean {
  if (process.platform !== "darwin") return true;
  return systemPreferences.isTrustedAccessibilityClient(true);
}

export function hasAccessibilityPermission(): boolean {
  if (process.platform !== "darwin") return true;
  return systemPreferences.isTrustedAccessibilityClient(false);
}

export async function requestAutomationPermission(): Promise<boolean> {
  if (process.platform !== "darwin") return true;

  try {
    await execFileAsync("osascript", [
      "-e",
      'tell application "System Events" to get name of every process',
    ]);
    return true;
  } catch (error: unknown) {
    if (isAutomationDeniedError(error)) return false;
    return false;
  }
}

export async function ensureQuickTranslatePermissions(): Promise<
  { ok: true } | { ok: false; message: string; missing: MacPrivacyPane }
> {
  if (process.platform !== "darwin") return { ok: true };

  const hasAX = hasAccessibilityPermission();
  if (!hasAX) {
    requestAccessibilityPermission();
    return {
      ok: false,
      missing: "accessibility",
      message:
        "Quick Translate needs Accessibility permission on macOS. Please allow this app in System Settings > Privacy & Security > Accessibility, then try again.",
    };
  }

  const hasAutomation = await requestAutomationPermission();
  if (!hasAutomation) {
    return {
      ok: false,
      missing: "automation",
      message:
        'Quick Translate needs Automation permission to control "System Events" on macOS. Please allow it in System Settings > Privacy & Security > Automation, then try again.',
    };
  }

  return { ok: true };
}

export async function openMacPrivacySettings(
  kind: MacPrivacyPane,
): Promise<void> {
  if (process.platform !== "darwin") return;

  const deepLink =
    kind === "accessibility"
      ? "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
      : "x-apple.systempreferences:com.apple.preference.security?Privacy_Automation";

  try {
    await shell.openExternal(deepLink);
  } catch {
    await shell.openExternal(
      "x-apple.systempreferences:com.apple.preference.security",
    );
  }
}
