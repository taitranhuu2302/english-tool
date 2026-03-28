# Quick Translate

A desktop quick-translate app for **Vietnamese ↔ English**, built with Electron + React + TypeScript.

---

## Features

- **Manual translation** — translate words, paragraphs, or long plain text; swap direction; copy output
- **Quick Translate** — press a global shortcut while text is selected in any app; a compact popup shows the translation instantly
- **Global shortcuts** — toggle show/hide the main window; trigger quick translate from anywhere
- **Custom shortcuts** — change both shortcuts from Settings; validated and registered with rollback on failure
- **System tray** — app lives in the tray when minimized; Show/Hide, Quick Translate, Settings, Quit
- **Persistent settings** — all preferences stored locally in your OS user data directory

---

## Project Structure

```
src/
├── main.ts                         # Electron main process bootstrap
├── preload.ts                      # contextBridge typed API (no ipcRenderer exposed)
├── renderer.ts                     # Main window renderer entry
├── renderer-quick.tsx              # Quick popup window renderer entry
├── app.tsx                         # Main window React root
├── index.css                       # Global Tailwind styles
│
├── shared/
│   ├── types.ts                    # Domain types: settings, results, errors
│   └── ipc-channels.ts            # Typed IPC channel constants
│
├── main/
│   ├── windows/window-manager.ts  # mainWindow + quickWindow lifecycle
│   ├── tray/tray-manager.ts       # System tray icon and menu
│   ├── shortcuts/shortcut-manager.ts  # Global shortcut registration + rollback
│   ├── settings/settings-store.ts # JSON settings persistence (userData/)
│   ├── translation/
│   │   ├── translation-provider.ts      # TranslationProvider interface
│   │   └── google-translate-provider.ts # axios implementation
│   ├── selection/
│   │   ├── native-input-adapter.ts      # OS copy-shortcut abstraction
│   │   ├── clipboard-snapshot-service.ts # Clipboard backup/restore
│   │   └── selection-capture-service.ts # Platform-aware text capture
│   └── ipc/register-ipc-handlers.ts    # All ipcMain handlers
│
├── renderer/
│   ├── app/providers.tsx           # QueryClientProvider + Sonner toaster
│   ├── lib/
│   │   ├── bridge.ts               # Typed window.electronAPI accessor
│   │   └── toast.ts                # showError/showSuccess helpers
│   └── features/
│       ├── translate/              # Main translate page + useTranslate hook
│       ├── settings/               # Settings page + shortcut input + hooks
│       └── quick-popup/            # Quick popup app + hooks
│
├── components/ui/                  # shadcn/ui components
└── tests/                          # Unit tests (Vitest)
    ├── settings-store.test.ts
    ├── google-translate-provider.test.ts
    ├── shortcut-manager.test.ts
    └── clipboard-snapshot-service.test.ts
```

---

## Setup

**Prerequisites:** Node.js ≥ 18, npm ≥ 9

```bash
git clone <repo>
cd quick-translate
npm install
```

---

## Development

```bash
npm start
```

Starts Electron Forge with Vite HMR for both the main window and the quick popup window.

---

## Type-check

```bash
npm run typecheck
```

---

## Lint

```bash
npm run lint
```

---

## Tests

```bash
npm test          # run once
npm run test:watch  # watch mode
```

Tests cover:
- `settings-store` — defaults, load/migrate, persist, corrupted file
- `google-translate-provider` — success, API error, timeout, network error
- `shortcut-manager` — format validation, conflict detection, register success, rollback on failure
- `clipboard-snapshot-service` — snapshot, restore text, restore image, restore failure

---

## Packaging

**macOS (zip):**
```bash
npm run make -- --platform darwin
```

**Windows (Squirrel installer):**
```bash
npm run make -- --platform win32
```

**Linux (deb/rpm, best-effort):**
```bash
npm run make -- --platform linux
```

Outputs are in `out/make/`.

---

## Native Automation — Quick Translate Capture

The Quick Translate shortcut captures selected text from another app by:

1. Snapshotting the current clipboard
2. Simulating the OS copy shortcut (Cmd+C / Ctrl+C) in the previously focused app
3. Reading the new clipboard value
4. Optionally restoring the original clipboard

This is handled by `ShellNativeInputAdapter` which uses:
- **macOS**: `osascript` (AppleScript)
- **Windows**: PowerShell `WScript.Shell.SendKeys('^c')`
- **Linux**: `xdotool key ctrl+c`

### macOS — Required Accessibility Permission

On macOS, simulating keystrokes via AppleScript requires the app to have **Accessibility access**:

1. Open **System Settings → Privacy & Security → Accessibility**
2. Enable **Quick Translate**

Without this permission, the capture will fail. The app will show a clear error message in the popup explaining this.

### Linux — xdotool

`xdotool` must be installed:
```bash
# Debian/Ubuntu
sudo apt install xdotool

# Arch
sudo pacman -S xdotool
```

### Alternative: Plugging in a native automation library

The `NativeInputAdapter` interface in `src/main/selection/native-input-adapter.ts` is designed to be swappable. To use a library like `@nut-tree-fork/nut-js`:

```typescript
import { keyboard, Key } from '@nut-tree-fork/nut-js';

class NutJsNativeInputAdapter implements NativeInputAdapter {
  async simulateCopyShortcut(): Promise<void> {
    await keyboard.pressKey(Key.LeftControl, Key.C);
    await keyboard.releaseKey(Key.LeftControl, Key.C);
  }
}
```

Pass it to `new SelectionCaptureService(new NutJsNativeInputAdapter())` in `main.ts`.

---

## Known Limitations (MVP)

- Text input only — no file import (.docx, .pdf, etc.)
- No auto-replace in the source app after translating
- No OCR, no speech input
- No translation history or cloud sync
- Linux support is best-effort

---

## Translation API

Uses [deep-translator-api](https://deep-translator-api.azurewebsites.net):

```
POST https://deep-translator-api.azurewebsites.net/google/
{ "source": "auto"|"vi"|"en", "target": "vi"|"en", "text": "..." }
```

The provider layer (`TranslationProvider` interface + `GoogleTranslateProvider`) is designed to be swappable with Google Cloud Translate or any other provider without changing the rest of the app.
