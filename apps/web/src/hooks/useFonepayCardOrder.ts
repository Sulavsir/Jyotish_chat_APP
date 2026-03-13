'use client';

/**
 * Fonepay Card Order Hook - TanStack Query mutation for Fonepay Card (redirect) payment flow
 *
 * This hook handles creating a Fonepay Card order which redirects to Fonepay for payment.
 * After payment, Fonepay redirects back to our success/fail URL.
 *
 * Usage:
 * ```tsx
 * const { createOrder, isCreating, error } = useFonepayCardOrder({
 *   onOrderCreated: (data) => {
 *     // Redirect happens automatically, but you can log it
 *     console.log('Redirecting to:', data.redirectUrl);
 *   },
 *   onError: (error) => console.error('Error:', error),
 * });
 *
 * // Create card order (will redirect to Fonepay)
 * createOrder({ amount: 100, coins: 10 });
 * ```
 */

import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { paymentService } from '@/services/payment.service';
import type {
  CreateFonepayCardOrderRequest,
  CreateFonepayCardOrderResponse,
} from '@/types/payment.types';

export interface UseFonepayCardOrderOptions {
  onOrderCreated?: (data: CreateFonepayCardOrderResponse) => void;
  onError?: (error: Error) => void;
  autoRedirect?: boolean;
}

export interface UseFonepayCardOrderResult {
  createOrder: (params: CreateFonepayCardOrderRequest) => void;
  isCreating: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Hook that manages Fonepay Card order creation.
 *
 * - `createOrder`: Creates a Fonepay Card order and optionally redirects to Fonepay
 * - By default, auto-redirects to the Fonepay payment page
 * - Set `autoRedirect: false` to handle redirect manually
 */
export function useFonepayCardOrder(
  options: UseFonepayCardOrderOptions = {}
): UseFonepayCardOrderResult {
  const { onOrderCreated, onError, autoRedirect = true } = options;

  const createOrderMutation = useMutation({
    mutationFn: (body: CreateFonepayCardOrderRequest) =>
      paymentService.createFonepayCardOrder(body),
    onSuccess: (data) => {
      onOrderCreated?.(data);
      if (autoRedirect && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
    onError: (err: Error) => {
      onError?.(err);
    },
  });

  const createOrder = useCallback(
    (params: CreateFonepayCardOrderRequest) => {
      createOrderMutation.mutate(params);
    },
    [createOrderMutation]
  );

  const reset = useCallback(() => {
    createOrderMutation.reset();
  }, [createOrderMutation]);

  return {
    createOrder,
    isCreating: createOrderMutation.isPending,
    error: createOrderMutation.error,
    reset,
  };
}

export default useFonepayCardOrder;
