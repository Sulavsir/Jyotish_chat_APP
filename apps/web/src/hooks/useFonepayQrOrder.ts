'use client';

/**
 * Fonepay QR Order Hook 
 */

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '@/services/payment.service';
import { QUERY_KEYS } from '@/constants';
import type {
  CreateFonepayQrOrderRequest,
  CreateFonepayQrOrderResponse,
  VerifyFonepayQrRequest,
  VerifyFonepayQrResponse,
} from '@/types/payment.types';

export interface UseFonepayQrOrderOptions {
  onOrderCreated?: (data: CreateFonepayQrOrderResponse) => void;
  onVerified?: (data: VerifyFonepayQrResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseFonepayQrOrderResult {
  createOrder: (params: CreateFonepayQrOrderRequest) => void;
  verifyOrder: (params: VerifyFonepayQrRequest) => void;
  orderData: CreateFonepayQrOrderResponse | null;
  isCreating: boolean;
  isVerifying: boolean;
  createError: Error | null;
  verifyError: Error | null;
  reset: () => void;
}

/**
 * Hook that manages Fonepay QR order creation and verification.
 *
 */
export function useFonepayQrOrder(
  options: UseFonepayQrOrderOptions = {}
): UseFonepayQrOrderResult {
  const { onOrderCreated, onVerified, onError } = options;
  const queryClient = useQueryClient();

  const createOrderMutation = useMutation({
    mutationFn: (body: CreateFonepayQrOrderRequest) =>
      paymentService.createFonepayQrOrder(body),
    onSuccess: (data) => {
      onOrderCreated?.(data);
    },
    onError: (err: Error) => {
      onError?.(err);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (body: VerifyFonepayQrRequest) =>
      paymentService.verifyFonepayQr(body),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
      }
      onVerified?.(data);
    },
    onError: (err: Error) => {
      onError?.(err);
    },
  });

  const createOrder = useCallback(
    (params: CreateFonepayQrOrderRequest) => {
      createOrderMutation.mutate(params);
    },
    [createOrderMutation]
  );

  const verifyOrder = useCallback(
    (params: VerifyFonepayQrRequest) => {
      verifyMutation.mutate(params);
    },
    [verifyMutation]
  );

  const reset = useCallback(() => {
    createOrderMutation.reset();
    verifyMutation.reset();
  }, [createOrderMutation, verifyMutation]);

  return {
    createOrder,
    verifyOrder,
    orderData: createOrderMutation.data ?? null,
    isCreating: createOrderMutation.isPending,
    isVerifying: verifyMutation.isPending,
    createError: createOrderMutation.error,
    verifyError: verifyMutation.error,
    reset,
  };
}

export default useFonepayQrOrder;
