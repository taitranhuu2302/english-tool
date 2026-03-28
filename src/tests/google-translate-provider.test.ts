import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPost = vi.fn();
const mockIsAxiosError = vi.fn(() => false);

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({ post: mockPost })),
    isAxiosError: mockIsAxiosError,
  },
  isAxiosError: mockIsAxiosError,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockIsAxiosError.mockReturnValue(false);
});

describe('GoogleTranslateProvider', () => {
  it('returns a TranslationResult on success', async () => {
    mockPost.mockResolvedValue({ data: { translation: 'Hello', error: null } });
    const { GoogleTranslateProvider } = await import('../main/translation/google-translate-provider');
    const provider = new GoogleTranslateProvider();
    const result = await provider.translate({ source: 'vi', target: 'en', text: 'Xin chào' });
    expect(result.translation).toBe('Hello');
    expect(result.sourceText).toBe('Xin chào');
    expect(result.target).toBe('en');
  });

  it('throws API_ERROR when response has error field', async () => {
    mockPost.mockResolvedValue({ data: { translation: null, error: 'Unsupported language' } });
    const { GoogleTranslateProvider } = await import('../main/translation/google-translate-provider');
    const provider = new GoogleTranslateProvider();
    await expect(provider.translate({ source: 'vi', target: 'en', text: 'test' }))
      .rejects.toThrow('API_ERROR');
  });

  it('throws API_ERROR when translation field is missing', async () => {
    mockPost.mockResolvedValue({ data: {} });
    const { GoogleTranslateProvider } = await import('../main/translation/google-translate-provider');
    const provider = new GoogleTranslateProvider();
    await expect(provider.translate({ source: 'vi', target: 'en', text: 'test' }))
      .rejects.toThrow('API_ERROR');
  });

  it('throws TIMEOUT on axios timeout', async () => {
    const timeoutError = Object.assign(new Error('timeout of 10000ms exceeded'), { code: 'ECONNABORTED' });
    mockIsAxiosError.mockReturnValue(true);
    mockPost.mockRejectedValue(timeoutError);
    const { GoogleTranslateProvider } = await import('../main/translation/google-translate-provider');
    const provider = new GoogleTranslateProvider();
    await expect(provider.translate({ source: 'vi', target: 'en', text: 'test' }))
      .rejects.toThrow('TIMEOUT');
  });

  it('throws NETWORK_ERROR on generic axios error', async () => {
    const netError = new Error('Network Error');
    mockIsAxiosError.mockReturnValue(true);
    mockPost.mockRejectedValue(netError);
    const { GoogleTranslateProvider } = await import('../main/translation/google-translate-provider');
    const provider = new GoogleTranslateProvider();
    await expect(provider.translate({ source: 'vi', target: 'en', text: 'test' }))
      .rejects.toThrow('NETWORK_ERROR');
  });
});
