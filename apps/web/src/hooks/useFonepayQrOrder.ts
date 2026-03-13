'use client';

/**
 * Fonepay QR Order Hook 
 */

import { useCallback, useRef } from 'react';
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

// Mutation key for caching
const FONEPAY_QR_MUTATION_KEY = ['fonepay-qr-create'] as const;

/**
 * Hook that manages Fonepay QR order creation and verification.
 * Uses refs to prevent duplicate API calls and preserve order data.
 */
export function useFonepayQrOrder(
  options: UseFonepayQrOrderOptions = {}
): UseFonepayQrOrderResult {
  const { onOrderCreated, onVerified, onError } = options;
  const queryClient = useQueryClient();
  
  // Track if we've already initiated a create request to prevent duplicates
  const createInitiatedRef = useRef(false);

  const createOrderMutation = useMutation({
    mutationKey: FONEPAY_QR_MUTATION_KEY,
    mutationFn: async (body: CreateFonepayQrOrderRequest) => {
      console.log('[useFonepayQrOrder] Creating order with params:', body);
      const result = await paymentService.createFonepayQrOrder(body);
      console.log('[useFonepayQrOrder] Order created:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('[useFonepayQrOrder] onSuccess - order data:', data);
      onOrderCreated?.(data);
    },
    onError: (err: Error) => {
      console.error('[useFonepayQrOrder] Create error:', err);
      // Reset the initiated flag so user can retry
      createInitiatedRef.current = false;
      onError?.(err);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (body: VerifyFonepayQrRequest) => {
      console.log('[useFonepayQrOrder] Verifying order with PRN:', body.prn);
      return paymentService.verifyFonepayQr(body);
    },
    onSuccess: (data) => {
      console.log('[useFonepayQrOrder] Verify result:', data);
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
      }
      onVerified?.(data);
    },
    onError: (err: Error) => {
      console.error('[useFonepayQrOrder] Verify error:', err);
      onError?.(err);
    },
  });

  const createOrder = useCallback(
    (params: CreateFonepayQrOrderRequest) => {
      // Prevent duplicate API calls
      if (createInitiatedRef.current) {
        console.log('[useFonepayQrOrder] Skipping create - already initiated');
        return;
      }
      if (createOrderMutation.data) {
        console.log('[useFonepayQrOrder] Skipping create - data already exists');
        return;
      }
      if (createOrderMutation.isPending) {
        console.log('[useFonepayQrOrder] Skipping create - already pending');
        return;
      }
      
      console.log('[useFonepayQrOrder] Initiating create order...');
      createInitiatedRef.current = true;
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
    console.log('[useFonepayQrOrder] Resetting state');
    createInitiatedRef.current = false;
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
