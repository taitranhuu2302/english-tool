import { clipboard } from 'electron';
import { NativeInputAdapter, ShellNativeInputAdapter } from './native-input-adapter';
import { ClipboardSnapshotService } from './clipboard-snapshot-service';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface SelectionCaptureOptions {
  delayMs: number;
  restoreClipboard: boolean;
}

export class SelectionCaptureService {
  private readonly adapter: NativeInputAdapter;
  private readonly clipboardService: ClipboardSnapshotService;

  constructor(adapter?: NativeInputAdapter, clipboardService?: ClipboardSnapshotService) {
    this.adapter = adapter ?? new ShellNativeInputAdapter();
    this.clipboardService = clipboardService ?? new ClipboardSnapshotService();
  }

  async captureSelectedText(options: SelectionCaptureOptions): Promise<string> {
    // Linux: X11 primary selection is directly readable
    if (process.platform === 'linux') {
      const selectionText = clipboard.readText('selection');
      if (selectionText) return selectionText;
      // fall through to copy strategy if selection buffer empty
    }

    // Windows / macOS (and Linux fallback):
    // 1. Snapshot current clipboard
    // 2. Simulate copy shortcut to overwrite clipboard with selected text
    // 3. Read the new clipboard value
    // 4. Optionally restore the original clipboard

    const snapshot = this.clipboardService.snapshot();

    try {
      await this.adapter.simulateCopyShortcut();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.startsWith('SELECTION_CAPTURE_FAILED:')) throw error;
      throw new Error(
        `SELECTION_CAPTURE_FAILED: Could not simulate copy shortcut. ${msg}`,
      );
    }

    await sleep(options.delayMs);

    const captured = clipboard.readText();

    if (options.restoreClipboard) {
      try {
        this.clipboardService.restore(snapshot);
      } catch (restoreError: unknown) {
        // Non-fatal: log but don't fail the translate flow
        console.warn('[SelectionCapture] Clipboard restore failed:', restoreError);
      }
    }

    if (!captured || captured.trim() === '') {
      throw new Error(
        'SELECTION_CAPTURE_FAILED: Could not get the selected text. ' +
          'Please select text first, then press the shortcut.',
      );
    }

    return captured;
  }
}

let captureService: SelectionCaptureService | null = null;

export function getSelectionCaptureService(): SelectionCaptureService {
  if (!captureService) captureService = new SelectionCaptureService();
  return captureService;
}
