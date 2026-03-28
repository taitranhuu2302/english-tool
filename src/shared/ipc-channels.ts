import type {
  AppSettings,
  TranslationRequest,
  TranslationResult,
  QuickTranslatePayload,
  Result,
} from './types';

// ─── Invoke channels (renderer → main, awaited) ──────────────────────────────

export const IPC = {
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_RESET_SHORTCUTS: 'settings:reset-shortcuts',

  TRANSLATE_MANUAL: 'translate:manual',

  QUICK_TRANSLATE_NOW: 'quick:translate-now',
  QUICK_RETRANSLATE: 'quick:retranslate',
  QUICK_CLOSE: 'quick:close',

  SHORTCUT_VALIDATE: 'shortcut:validate',
  SHORTCUT_UPDATE: 'shortcut:update',

  APP_OPEN_SETTINGS: 'app:open-settings',
  APP_OPEN_FULL: 'app:open-full',
  APP_TOGGLE: 'app:toggle',
} as const;

// ─── Push channels (main → renderer, one-way events) ─────────────────────────

export const PUSH = {
  QUICK_LOADING: 'quick:loading',
  QUICK_SHOW: 'quick:show',
  QUICK_ERROR: 'quick:error',
} as const;

// ─── Typed IPC map ────────────────────────────────────────────────────────────

export interface IpcInvokeMap {
  [IPC.SETTINGS_GET]: { args: []; ret: AppSettings };
  [IPC.SETTINGS_UPDATE]: { args: [Partial<AppSettings>]; ret: Result<AppSettings> };
  [IPC.SETTINGS_RESET_SHORTCUTS]: { args: []; ret: Result<AppSettings> };

  [IPC.TRANSLATE_MANUAL]: { args: [TranslationRequest]; ret: Result<TranslationResult> };

  [IPC.QUICK_TRANSLATE_NOW]: { args: []; ret: Result<void> };
  [IPC.QUICK_RETRANSLATE]: { args: [TranslationRequest]; ret: Result<TranslationResult> };
  [IPC.QUICK_CLOSE]: { args: []; ret: void };

  [IPC.SHORTCUT_VALIDATE]: { args: [string]; ret: Result<void> };
  [IPC.SHORTCUT_UPDATE]: {
    args: [{ key: 'quickTranslateShortcut' | 'toggleAppShortcut'; value: string }];
    ret: Result<AppSettings>;
  };

  [IPC.APP_OPEN_SETTINGS]: { args: []; ret: void };
  [IPC.APP_OPEN_FULL]: { args: []; ret: void };
  [IPC.APP_TOGGLE]: { args: []; ret: void };
}

export interface IpcPushMap {
  [PUSH.QUICK_LOADING]: void;
  [PUSH.QUICK_SHOW]: QuickTranslatePayload;
  [PUSH.QUICK_ERROR]: string;
}
