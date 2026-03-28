import axios, { AxiosInstance } from 'axios';
import { TranslationRequest, TranslationResult } from '../../shared/types';
import { TranslationProvider } from './translation-provider';

const BASE_URL = 'https://deep-translator-api.azurewebsites.net';
const TIMEOUT_MS = 10_000;

interface ApiResponse {
  translation?: string;
  error?: string | null;
}

export class GoogleTranslateProvider implements TranslationProvider {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: TIMEOUT_MS,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    let data: ApiResponse;

    try {
      const response = await this.client.post<ApiResponse>('/google/', {
        source: request.source,
        target: request.target,
        text: request.text,
      });
      data = response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          throw new Error('TIMEOUT: Translation request timed out');
        }
        throw new Error(`NETWORK_ERROR: ${error.message}`);
      }
      throw new Error(`NETWORK_ERROR: ${String(error)}`);
    }

    if (data.error) {
      throw new Error(`API_ERROR: ${data.error}`);
    }

    if (typeof data.translation !== 'string') {
      throw new Error('API_ERROR: Invalid response shape from translation API');
    }

    return {
      translation: data.translation,
      sourceText: request.text,
      source: request.source,
      target: request.target,
    };
  }
}

let provider: GoogleTranslateProvider | null = null;

export function getTranslationProvider(): GoogleTranslateProvider {
  if (!provider) provider = new GoogleTranslateProvider();
  return provider;
}
