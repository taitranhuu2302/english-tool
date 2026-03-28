import { app } from 'electron';
import started from 'electron-squirrel-startup';
import { appBus } from './main/app-bus';
import { getWindowManager } from './main/windows/window-manager';
import { createTray, destroyTray, usesMenuBarTray } from './main/tray/tray-manager';
import { getSettingsStore } from './main/settings/settings-store';
import { registerDefaultShortcuts, getShortcutManager } from './main/shortcuts/shortcut-manager';
import { registerIpcHandlers } from './main/ipc/register-ipc-handlers';
import { runQuickTranslatePipeline } from './main/quick-translate-flow';

if (started) app.quit();

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    getWindowManager().showMain();
  });
}

app.whenReady().then(() => {
  const settings = getSettingsStore();
  const s = settings.get();
  const wm = getWindowManager();

  wm.createMainWindow();
  wm.createQuickWindow();

  if (usesMenuBarTray) {
    createTray();
  }

  // ── Shortcut handlers ────────────────────────────────────────────────────
  const toggleApp = () => wm.toggleMain();

  const quickTranslate = () => {
    void runQuickTranslatePipeline();
  };

  // Allow tray to trigger quick translate
  appBus.on('quick-translate-trigger', quickTranslate);

  registerIpcHandlers({ toggleApp, quickTranslate });
  registerDefaultShortcuts(s, { toggleApp, quickTranslate });

  const startHiddenToTray = usesMenuBarTray && s.startMinimized;
  if (!startHiddenToTray) {
    wm.showMain();
  }
});

app.on('window-all-closed', () => {
  // Windows/Linux: keep running for menu bar tray. macOS: Dock keeps the app alive until Cmd+Q.
});

app.on('before-quit', () => {
  getShortcutManager().unregisterAll();
  destroyTray();
});

app.on('activate', () => {
  getWindowManager().showMain();
});
