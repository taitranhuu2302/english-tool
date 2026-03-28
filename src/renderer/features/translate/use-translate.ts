import { useMutation } from '@tanstack/react-query';
import { bridge } from '../../lib/bridge';
import { showError } from '../../lib/toast';
import type { TranslationRequest, TranslationResult, Result } from '../../../shared/types';

export function useTranslate() {
  return useMutation<Result<TranslationResult>, Error, TranslationRequest>({
    mutationFn: (request) => bridge.translate.manual(request),
    onError: () => showError('Translation request failed'),
  });
}
