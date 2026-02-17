'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { CreateOrderResponse } from '@/types/payment.types';

declare global {
  interface Window {
    GetPay?: new (options: GetPayOptions) => { initialize: () => void };
  }
}

export interface GetPayOptions {
  papInfo: string;
  oprKey?: string;
  insKey?: string;
  websiteDomain: string;
  amount: number;
  callbackUrl?: string;
  successUrl?: string;
  failUrl?: string;
  clientRequestId: string;
}

export interface GetPayCheckoutProps {
  checkoutData: CreateOrderResponse | null;
  onError?: (message: string) => void;
}

/**
 * Loads GetPay script and initializes checkout when checkoutData is set.
 * Caller should create order first and pass the response here.
 */
export function GetPayCheckout({ checkoutData, onError }: GetPayCheckoutProps) {
  const scriptLoaded = useRef(false);
  const initializing = useRef(false);

  const loadScript = useCallback(
    (src: string): Promise<void> =>
      new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load GetPay script'));
        document.body.appendChild(script);
      }),
    []
  );

  useEffect(() => {
    if (!checkoutData?.scriptUrl || !checkoutData?.orderId || initializing.current) return;

    const init = async () => {
      initializing.current = true;
      try {
        if (!scriptLoaded.current) {
          await loadScript(checkoutData.scriptUrl);
          scriptLoaded.current = true;
        }

        const GetPay = window.GetPay;
        if (!GetPay) {
          onError?.('Payment gateway is not available. Please try again.');
          return;
        }

        const options: GetPayOptions = {
          papInfo: checkoutData.papInfo,
          websiteDomain: checkoutData.websiteDomain,
          amount: checkoutData.amount,
          clientRequestId: checkoutData.orderId,
          successUrl: checkoutData.successUrl,
          failUrl: checkoutData.failUrl,
        };

        new GetPay(options).initialize();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start checkout';
        onError?.(message);
      } finally {
        initializing.current = false;
      }
    };

    init();
  }, [checkoutData, loadScript, onError]);

  return null;
}
