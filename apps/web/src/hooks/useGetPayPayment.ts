'use client';

/**
 * GetPay Payment Hook - TanStack Query mutations for GetPay payment flow
 *
 * 
 */

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '@/services/payment.service';
import { QUERY_KEYS } from '@/constants';
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
} from '@/types/payment.types';

export interface UseGetPayPaymentOptions {
  onOrderCreated?: (data: CreateOrderResponse) => void;
  onPaymentVerified?: (data: VerifyPaymentResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseGetPayPaymentResult {
  createOrder: (params: CreateOrderRequest) => void;
  verifyPayment: (params: VerifyPaymentRequest) => void;
  checkoutData: CreateOrderResponse | null;
  isCreating: boolean;
  isVerifying: boolean;
  createError: Error | null;
  verifyError: Error | null;
  reset: () => void;
}

/**
 * Hook that manages GetPay payment flow using TanStack Query mutations.
 *
 * - `createOrder`: Creates a payment order and returns checkout data for GetPay script
 * - `verifyPayment`: Verifies the payment after GetPay redirects back
 * - Automatically invalidates coin balance after successful verification
 */
export function useGetPayPayment(
  options: UseGetPayPaymentOptions = {}
): UseGetPayPaymentResult {
  const { onOrderCreated, onPaymentVerified, onError } = options;
  const queryClient = useQueryClient();

  const createOrderMutation = useMutation({
    mutationFn: (body: CreateOrderRequest) => paymentService.createOrder(body),
    onSuccess: (data) => {
      onOrderCreated?.(data);
    },
    onError: (err: Error) => {
      onError?.(err);
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: (body: VerifyPaymentRequest) => paymentService.verifyPayment(body),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
      }
      onPaymentVerified?.(data);
    },
    onError: (err: Error) => {
      onError?.(err);
    },
  });

  const createOrder = useCallback(
    (params: CreateOrderRequest) => {
      createOrderMutation.mutate(params);
    },
    [createOrderMutation]
  );

  const verifyPayment = useCallback(
    (params: VerifyPaymentRequest) => {
      verifyPaymentMutation.mutate(params);
    },
    [verifyPaymentMutation]
  );

  const reset = useCallback(() => {
    createOrderMutation.reset();
    verifyPaymentMutation.reset();
  }, [createOrderMutation, verifyPaymentMutation]);

  return {
    createOrder,
    verifyPayment,
    checkoutData: createOrderMutation.data ?? null,
    isCreating: createOrderMutation.isPending,
    isVerifying: verifyPaymentMutation.isPending,
    createError: createOrderMutation.error,
    verifyError: verifyPaymentMutation.error,
    reset,
  };
}

export default useGetPayPayment;
