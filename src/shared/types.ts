export type LanguageCode = 'vi' | 'en';
export type TranslateSource = 'auto' | 'vi' | 'en';
export type ManualDirection = 'vi-en' | 'en-vi';

export interface TranslationRequest {
  source: TranslateSource;
  target: LanguageCode;
  text: string;
}

export interface TranslationResult {
  translation: string;
  sourceText: string;
  source: TranslateSource;
  target: LanguageCode;
}

export interface AppSettings {
  version: number;
  manualDirection: ManualDirection;
  quickTargetLanguage: LanguageCode;
  quickTranslateShortcut: string;
  toggleAppShortcut: string;
  autoCopyDelayMs: number;
  restoreClipboard: boolean;
  popupAlwaysOnTop: boolean;
  startMinimized: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  version: 1,
  manualDirection: 'vi-en',
  quickTargetLanguage: 'en',
  quickTranslateShortcut: 'CommandOrControl+Alt+T',
  toggleAppShortcut: 'CommandOrControl+Shift+Space',
  autoCopyDelayMs: 200,
  restoreClipboard: true,
  popupAlwaysOnTop: true,
  startMinimized: false,
};

export type AppErrorCode =
  | 'EMPTY_TEXT'
  | 'SELECTION_CAPTURE_FAILED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'API_ERROR'
  | 'SHORTCUT_CONFLICT'
  | 'SHORTCUT_INVALID'
  | 'SHORTCUT_REGISTER_FAILED'
  | 'CLIPBOARD_RESTORE_FAILED'
  | 'POPUP_NOT_READY'
  | 'UNKNOWN';

export interface AppError {
  code: AppErrorCode;
  message: string;
}

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };

export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

export function err(code: AppErrorCode, message: string): Result<never> {
  return { success: false, error: { code, message } };
}

export function isOk<T>(r: Result<T>): r is { success: true; data: T } {
  return r.success === true;
}

export function isErr<T>(r: Result<T>): r is { success: false; error: AppError } {
  return r.success === false;
}

export interface QuickTranslatePayload {
  original: string;
  translated: string;
  source: TranslateSource;
  target: LanguageCode;
}
