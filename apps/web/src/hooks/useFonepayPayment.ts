'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fonepayService } from '@/services/fonepay.service';
import { QUERY_KEYS } from '@/constants';
import type {
  FonepayGenerateRequest,
  FonepayPaymentState,
  FonepayWsEvent,
} from '@/types/fonepay.types';

export interface UseFonepayPaymentOptions {
  onSuccess?: (prn: string) => void;
  onFailure?: (prn: string) => void;
}

export interface UseFonepayPaymentResult {
  state: FonepayPaymentState;
  prn: string | null;
  qrMessage: string | null;
  websocketUrl: string | null;
  error: string | null;
  generateQr: (params: FonepayGenerateRequest) => void;
  checkStatus: (prn: string) => void;
  reset: () => void;
  isGenerating: boolean;
  handleWsEvent: (event: FonepayWsEvent) => void;
}

const initialState = {
  state: 'idle' as FonepayPaymentState,
  prn: null as string | null,
  qrMessage: null as string | null,
  websocketUrl: null as string | null,
  error: null as string | null,
};

/**
 * Hook that manages Fonepay QR payment flow: idle → generating → waiting_scan → verified → paid / failed.
 * Uses TanStack mutation for generate and optional check-status; useFonepayWebSocket can feed events.
 */
export function useFonepayPayment(
  options: UseFonepayPaymentOptions = {}
): UseFonepayPaymentResult {
  const { onSuccess, onFailure } = options;
  const [local, setLocal] = useState(initialState);
  const prnRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    prnRef.current = local.prn;
  }, [local.prn]);

  const generateMutation = useMutation({
    mutationFn: (body: FonepayGenerateRequest) => fonepayService.generateQr(body),
    onMutate: () => {
      setLocal((prev) => ({ ...prev, state: 'generating', error: null }));
    },
    onSuccess: (data, variables) => {
      setLocal({
        state: 'waiting_scan',
        prn: variables.prn ?? null,
        qrMessage: data.qrMessage ?? null,
        websocketUrl: data.websocketUrl ?? null,
        error: null,
      });
    },
    onError: (err: Error) => {
      setLocal((prev) => ({
        ...prev,
        state: 'idle',
        error: err.message,
      }));
    },
  });

  const checkStatusMutation = useMutation({
    mutationFn: (prn: string) => fonepayService.checkStatus({ prn }),
    onSuccess: (data, prn) => {
      if (data.paymentStatus === 'success') {
        setLocal((prev) => ({ ...prev, state: 'paid', error: null }));
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
        onSuccess?.(prn);
      } else if (data.paymentStatus === 'failed') {
        setLocal((prev) => ({ ...prev, state: 'failed' }));
        onFailure?.(prn);
      }
    },
    onError: (err: Error) => {
      setLocal((prev) => ({ ...prev, error: err.message }));
    },
  });

  const generateQr = useCallback(
    (params: FonepayGenerateRequest) => {
      generateMutation.mutate(params);
    },
    [generateMutation]
  );

  const checkStatus = useCallback(
    (prn: string) => {
      checkStatusMutation.mutate(prn);
    },
    [checkStatusMutation]
  );

  const reset = useCallback(() => {
    setLocal(initialState);
  }, []);

  /** Call this when WebSocket emits an event (e.g. from useFonepayWebSocket onEvent). */
  const handleWsEvent = useCallback(
    (event: FonepayWsEvent) => {
      const currentPrn = prnRef.current;
      if (event.type === 'verified') {
        setLocal((prev) => (prev.state === 'waiting_scan' ? { ...prev, state: 'verified' } : prev));
      } else if (event.type === 'payment_success') {
        setLocal((prev) => {
          if (prev.state !== 'waiting_scan' && prev.state !== 'verified') return prev;
          return { ...prev, state: 'paid', error: null };
        });
        if (currentPrn) {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
          onSuccess?.(currentPrn);
        }
      } else if (event.type === 'payment_failed') {
        setLocal((prev) => (prev.state === 'waiting_scan' || prev.state === 'verified' ? { ...prev, state: 'failed' } : prev));
        if (currentPrn) onFailure?.(currentPrn);
      }
    },
    [onSuccess, onFailure, queryClient]
  );

  return {
    state: local.state,
    prn: local.prn,
    qrMessage: local.qrMessage,
    websocketUrl: local.websocketUrl,
    error: local.error,
    generateQr,
    checkStatus,
    reset,
    isGenerating: generateMutation.isPending,
    handleWsEvent,
  };
}

