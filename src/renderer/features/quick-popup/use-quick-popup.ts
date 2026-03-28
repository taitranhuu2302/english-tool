import { useMutation } from '@tanstack/react-query';
import { bridge } from '../../lib/bridge';
import type { TranslationRequest, TranslationResult, Result } from '../../../shared/types';
import { showError } from '../../lib/toast';

export function useQuickRetranslate() {
  return useMutation<Result<TranslationResult>, Error, TranslationRequest>({
    mutationFn: (request) => bridge.quick.retranslate(request),
    onError: () => showError('Retranslation failed'),
  });
}

export function useQuickClose() {
  return useMutation({
    mutationFn: () => bridge.quick.close(),
  });
}

export function useOpenFull() {
  return useMutation({
    mutationFn: () => bridge.app.openFull(),
  });
}
