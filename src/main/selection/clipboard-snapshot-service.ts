import { clipboard, nativeImage } from 'electron';

export interface ClipboardSnapshot {
  text: string;
  html: string;
  rtf: string;
  hasImage: boolean;
  imageDataUrl?: string;
}

export class ClipboardSnapshotService {
  snapshot(): ClipboardSnapshot {
    let hasImage = false;
    let imageDataUrl: string | undefined;

    try {
      const img = clipboard.readImage();
      if (!img.isEmpty()) {
        hasImage = true;
        imageDataUrl = img.toDataURL();
      }
    } catch {
      // ignore
    }

    return {
      text: clipboard.readText(),
      html: clipboard.readHTML(),
      rtf: clipboard.readRTF(),
      hasImage,
      imageDataUrl,
    };
  }

  restore(snap: ClipboardSnapshot): void {
    try {
      clipboard.clear();

      if (snap.hasImage && snap.imageDataUrl) {
        try {
          const img = nativeImage.createFromDataURL(snap.imageDataUrl);
          clipboard.writeImage(img);
        } catch {
          // image restore failed; fall through to text restore
        }
      }

      const hasTextContent = snap.text || snap.html || snap.rtf;
      if (hasTextContent) {
        clipboard.write({
          text: snap.text,
          html: snap.html || undefined,
          rtf: snap.rtf || undefined,
        });
      } else if (!snap.hasImage) {
        clipboard.clear();
      }
    } catch (error: unknown) {
      throw new Error(
        `CLIPBOARD_RESTORE_FAILED: Could not restore clipboard contents. ${String(error)}`,
      );
    }
  }
}

let service: ClipboardSnapshotService | null = null;

export function getClipboardSnapshotService(): ClipboardSnapshotService {
  if (!service) service = new ClipboardSnapshotService();
  return service;
}
