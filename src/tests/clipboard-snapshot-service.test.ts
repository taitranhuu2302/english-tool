import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockClipboard = {
  readText: vi.fn(),
  readHTML: vi.fn(),
  readRTF: vi.fn(),
  readImage: vi.fn(),
  clear: vi.fn(),
  writeImage: vi.fn(),
  write: vi.fn(),
};

const mockNativeImage = {
  createFromDataURL: vi.fn(),
  isEmpty: vi.fn(),
};

vi.mock('electron', () => ({
  clipboard: mockClipboard,
  nativeImage: {
    createFromDataURL: mockNativeImage.createFromDataURL,
  },
}));

describe('ClipboardSnapshotService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClipboard.readImage.mockReturnValue({ isEmpty: () => true });
  });

  it('snapshots text, html, and rtf', async () => {
    mockClipboard.readText.mockReturnValue('hello');
    mockClipboard.readHTML.mockReturnValue('<b>hello</b>');
    mockClipboard.readRTF.mockReturnValue('{\\rtf1 hello}');

    const { ClipboardSnapshotService } = await import('../main/selection/clipboard-snapshot-service');
    const svc = new ClipboardSnapshotService();
    const snap = svc.snapshot();

    expect(snap.text).toBe('hello');
    expect(snap.html).toBe('<b>hello</b>');
    expect(snap.rtf).toBe('{\\rtf1 hello}');
    expect(snap.hasImage).toBe(false);
  });

  it('restores text content', async () => {
    const { ClipboardSnapshotService } = await import('../main/selection/clipboard-snapshot-service');
    const svc = new ClipboardSnapshotService();
    svc.restore({ text: 'restored', html: '', rtf: '', hasImage: false });

    expect(mockClipboard.clear).toHaveBeenCalledOnce();
    expect(mockClipboard.write).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'restored' }),
    );
  });

  it('restores image when hasImage is true', async () => {
    const fakeImage = { toDataURL: () => 'data:image/png;base64,abc' };
    const fakeNativeImg = {};
    mockClipboard.readImage.mockReturnValue({ isEmpty: () => false, ...fakeImage });
    mockNativeImage.createFromDataURL.mockReturnValue(fakeNativeImg);

    const { ClipboardSnapshotService } = await import('../main/selection/clipboard-snapshot-service');
    const svc = new ClipboardSnapshotService();

    svc.restore({
      text: '',
      html: '',
      rtf: '',
      hasImage: true,
      imageDataUrl: 'data:image/png;base64,abc',
    });

    expect(mockClipboard.writeImage).toHaveBeenCalledWith(fakeNativeImg);
  });

  it('throws CLIPBOARD_RESTORE_FAILED on write error', async () => {
    mockClipboard.clear.mockImplementation(() => { throw new Error('disk full'); });

    const { ClipboardSnapshotService } = await import('../main/selection/clipboard-snapshot-service');
    const svc = new ClipboardSnapshotService();

    expect(() => svc.restore({ text: 'hi', html: '', rtf: '', hasImage: false }))
      .toThrow('CLIPBOARD_RESTORE_FAILED');
  });
});
