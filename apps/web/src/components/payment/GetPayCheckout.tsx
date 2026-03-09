'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { CreateOrderResponse } from '@/types/payment.types';
import { Button } from '@jyotish/ui';
import { useAuthStore } from '@/store/auth-store';

declare global {
  interface Window {
    GetPay?: new (options: GetPayOptions) => { initialize: () => void };
  }
}

export interface GetPayOptions {
  papInfo: string;
  oprKey?: string;
  insKey?: string;
  baseUrl?: string;
  websiteDomain: string;
  amount?: number;
  price?: number;
  currency?: string;
  callbackUrl?: { successUrl: string; failUrl: string };
  successUrl?: string;
  failUrl?: string;
  clientRequestId: string;
  businessName?: string;
  imageUrl?: string;
  themeColor?: string;
  backgroundColor?: string; // Custom background color for checkout
  cardInputStyle?: {
    backgroundColor?: string;
    borderColor?: string;
    borderRadius?: string;
    fontSize?: string;
    fontFamily?: string;
  };
  userInfo?: {
    name?: string;
    email?: string;
    city?: string;
    country?: string;
    state?: string;
    zipcode?: string;
    address?: string;
  };
  onSuccess?: (options: unknown) => void;
  onError?: (error: unknown) => void;
  [key: string]: unknown;
}

export interface GetPayCheckoutProps {
  checkoutData: CreateOrderResponse | null;
  onError?: (message: string) => void;
}

/** GetPay frontend keys (from env); oprKey is required for operator-hosted checkout. */
function getGetPayEnv() {
  const oprKey = process.env.NEXT_PUBLIC_GETPAY_OPR_KEY?.trim() || '';
  const insKey = process.env.NEXT_PUBLIC_GETPAY_INS_KEY?.trim() || '';
  const baseUrl = process.env.NEXT_PUBLIC_GETPAY_BASE_URL?.trim() || '';
  
  return {
    oprKey,
    insKey: insKey || undefined, // Only return if non-empty (insKey is optional)
    baseUrl: baseUrl || undefined, // Only return if non-empty
  };
}

/**
 * Loads GetPay script and initializes checkout when checkoutData is set.
 * Caller should create order first and pass the response here.
 * Requires NEXT_PUBLIC_GETPAY_OPR_KEY (and optionally INS_KEY, BASE_URL) in env.
 */
export function GetPayCheckout({ checkoutData, onError }: GetPayCheckoutProps) {
  const scriptLoaded = useRef(false);
  const initializing = useRef(false);
  const [showButton, setShowButton] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const user = useAuthStore((state) => state.user);

  const loadScript = useCallback(
    (src: string): Promise<void> =>
      new Promise((resolve, reject) => {
        // Check if script already exists
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
          // If script exists, check if GetPay is available
          if (window.GetPay) {
            resolve();
            return;
          }
          // If script exists but GetPay isn't loaded yet, wait a bit
          let attempts = 0;
          const checkInterval = setInterval(() => {
            attempts++;
            if (window.GetPay) {
              clearInterval(checkInterval);
              resolve();
            } else if (attempts > 20) {
              clearInterval(checkInterval);
              reject(new Error('GetPay script loaded but GetPay class not available'));
            }
          }, 100);
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        // Don't set crossOrigin - some scripts don't work with it
        // script.async = true; // defer and async together can cause issues
        
        script.onload = () => {
          // Wait a bit for GetPay to be available
          let attempts = 0;
          const checkInterval = setInterval(() => {
            attempts++;
            if (window.GetPay) {
              clearInterval(checkInterval);
              resolve();
            } else if (attempts > 50) {
              clearInterval(checkInterval);
              reject(new Error('GetPay script loaded but GetPay class not available after 5 seconds'));
            }
          }, 100);
        };
        
        script.onerror = (error) => {
          console.error('GetPay script load error:', error);
          console.error('Script URL:', src);
          reject(new Error(`Failed to load GetPay script from ${src}. Please check your network connection and ensure the script URL is accessible.`));
        };
        
        // Try appending to head first (as per GetPay docs), fallback to body
        const target = document.head || document.body;
        target.appendChild(script);
      }),
    []
  );

  useEffect(() => {
    if (!checkoutData?.scriptUrl || !checkoutData?.orderId || initializing.current) return;

    const { oprKey, insKey, baseUrl } = getGetPayEnv();
    if (!oprKey) {
      onError?.('Payment is not configured. Please set NEXT_PUBLIC_GETPAY_OPR_KEY.');
      return;
    }

    const init = async () => {
      initializing.current = true;
      try {
        console.log('GetPay: Loading script from', checkoutData.scriptUrl);
        
        if (!scriptLoaded.current) {
          await loadScript(checkoutData.scriptUrl);
          scriptLoaded.current = true;
          console.log('GetPay: Script loaded successfully');
        }

        // Wait a bit more to ensure GetPay is available
        let attempts = 0;
        while (!window.GetPay && attempts < 10) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
        }

        const GetPay = window.GetPay;
        if (!GetPay) {
          console.error('GetPay: window.GetPay is not available after loading script');
          onError?.('Payment gateway is not available. Please refresh the page and try again.');
          return;
        }

        console.log('GetPay: Initializing checkout with options:', {
          orderId: checkoutData.orderId,
          amount: checkoutData.amount,
          websiteDomain: checkoutData.websiteDomain,
          hasOprKey: !!oprKey,
          hasInsKey: !!insKey,
          hasBaseUrl: !!baseUrl,
        });

        // Build options object
        // Note: insKey is optional per docs, but GetPay validation may require the key to be present
        // Set it to empty string if not provided (as docs say "this field is to be left blank")
        const options: GetPayOptions = {
          papInfo: checkoutData.papInfo,
          oprKey, // Required
          insKey: insKey && insKey.trim().length > 0 ? insKey : '', 
          websiteDomain: checkoutData.websiteDomain,
          price: checkoutData.amount,
          amount: checkoutData.amount,
          currency: checkoutData.currency ?? 'NPR',
          clientRequestId: checkoutData.orderId,
          successUrl: checkoutData.successUrl,
          failUrl: checkoutData.failUrl,
          callbackUrl: {
            successUrl: checkoutData.successUrl,
            failUrl: checkoutData.failUrl,
          },
          businessName: process.env.NEXT_PUBLIC_APP_NAME || 'Chat Jyotish',
          themeColor: '#f59e0b', // amber-500
          backgroundColor: '#ffffff', // Plain white background
          // Add userInfo if available (some gateways require it)
          ...(user && {
            userInfo: {
              name: user.name || user.email || 'User',
              email: user.email || '',
            },
          }),
          // GetPay doc: "After payment is processed, the page is then redirected to the provided success or failure page."
          // We do NOT redirect here - GetPay redirects the browser to successUrl/failUrl (with token in hash). Our success page reads token and calls merchant-status.
          onSuccess: (opts) => {
            console.log('GetPay: onSuccess callback (GetPay will redirect to successUrl)', opts);
          },
          onError: (error) => {
            console.error('GetPay: onError callback', error);
            onError?.('Payment gateway error. Please try again.');
          },
        };

        // Only include baseUrl if it's provided and non-empty
        if (baseUrl && baseUrl.trim().length > 0) {
          options.baseUrl = baseUrl;
        }

        console.log('GetPay: Options being sent (excluding sensitive data):', {
          hasPapInfo: !!options.papInfo,
          hasOprKey: !!options.oprKey,
          hasInsKey: !!options.insKey,
          hasBaseUrl: !!options.baseUrl,
          websiteDomain: options.websiteDomain,
          price: options.price,
          currency: options.currency,
          clientRequestId: options.clientRequestId,
        });

        // Store orderId so if the bundle redirects to /?token=... we can redirect to payment-success with orderId
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('getpay_pending_order_id', checkoutData.orderId);
          }
        } catch {
          // ignore
        }

        // Try to initialize automatically
        try {
          console.log('GetPay: Calling initialize() with options:', {
            orderId: checkoutData.orderId,
            amount: checkoutData.amount,
            websiteDomain: checkoutData.websiteDomain,
            hasOprKey: !!oprKey,
          });
          
          const getPayInstance = new GetPay(options);
          getPayInstance.initialize();
          
          console.log('GetPay: initialize() called successfully');
          
          // If nothing happens after 3 seconds, show button as fallback
          setTimeout(() => {
            console.log('GetPay: Timeout - showing fallback button');
            setShowButton(true);
          }, 3000);
        } catch (initError) {
          console.error('GetPay: Auto-init failed, showing button', initError);
          setShowButton(true);
        }
        
        setScriptReady(true);
      } catch (err) {
        console.error('GetPay: Error during initialization', err);
        const message = err instanceof Error ? err.message : 'Failed to start checkout';
        onError?.(message);
      } finally {
        initializing.current = false;
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutData, loadScript, onError]);

  const handleManualInit = () => {
    if (!checkoutData || !window.GetPay) {
      onError?.('Payment gateway is not ready. Please refresh and try again.');
      return;
    }

    const { oprKey, insKey, baseUrl } = getGetPayEnv();
    if (!oprKey) {
      onError?.('Payment is not configured.');
      return;
    }

    try {
      // Build options object
      // Note: insKey is optional per docs, but GetPay validation may require the key to be present
      // Set it to empty string if not provided (as docs say "this field is to be left blank")
      const options: GetPayOptions = {
        papInfo: checkoutData.papInfo,
        oprKey, // Required
        insKey: insKey && insKey.trim().length > 0 ? insKey : '', // Optional but must be present - set to empty string if not provided
        websiteDomain: checkoutData.websiteDomain,
        price: checkoutData.amount,
        amount: checkoutData.amount,
        currency: checkoutData.currency ?? 'NPR',
        clientRequestId: checkoutData.orderId,
        successUrl: checkoutData.successUrl,
        failUrl: checkoutData.failUrl,
        callbackUrl: {
          successUrl: checkoutData.successUrl,
          failUrl: checkoutData.failUrl,
        },
        businessName: process.env.NEXT_PUBLIC_APP_NAME || 'Chat Jyotish',
        themeColor: '#f59e0b',
        backgroundColor: '#ffffff', // Plain white background
        // Add userInfo if available
        ...(user && {
          userInfo: {
            name: user.name || user.email || 'User',
            email: user.email || '',
          },
        }),
          onSuccess: (opts: unknown) => {
            console.log('GetPay: onSuccess callback (manual, GetPay will redirect)', opts);
          },
          onError: (error: unknown) => {
            console.error('GetPay: onError callback', error);
            onError?.('Payment gateway error. Please try again.');
          },
      };

      // Only include baseUrl if it's provided and non-empty
      if (baseUrl && baseUrl.trim().length > 0) {
        options.baseUrl = baseUrl;
      }

      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('getpay_pending_order_id', checkoutData.orderId);
        }
      } catch {
        // ignore
      }
      console.log('GetPay: Manual initialization triggered');
      const GetPayClass = window.GetPay;
      if (!GetPayClass) {
        throw new Error('GetPay class not available');
      }
      new GetPayClass(options).initialize();
    } catch (err) {
      console.error('GetPay: Manual init error', err);
      onError?.(err instanceof Error ? err.message : 'Failed to start checkout');
    }
  };

  return (
    <div className="getpay-checkout-wrapper w-full">
      <div id="checkout" className="w-full" />
    </div>
  );
}
