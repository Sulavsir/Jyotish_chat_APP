'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

const PENDING_ORDER_KEY = 'getpay_pending_order_id';
const TOKEN_PARAMS = ['token', 'transactionId', 'requestId', 'id'];

/**
 * If the GetPay bundle redirects to /?token=... (root with only token),
 * redirect to /payment-success with orderId from sessionStorage so we can verify and top up coins.
 */
export function PaymentRedirectHandler() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== '/' || typeof window === 'undefined') return;

    let token = '';
    for (const name of TOKEN_PARAMS) {
      const v = searchParams.get(name)?.trim();
      if (v) {
        token = v;
        break;
      }
    }
    if (!token) return;

    let orderId = '';
    try {
      orderId = sessionStorage.getItem(PENDING_ORDER_KEY)?.trim() ?? '';
    } catch {
      // ignore
    }

    const params = new URLSearchParams();
    params.set('token', token);
    if (orderId) params.set('orderId', orderId);
    router.replace(`/payment-success?${params.toString()}`);
  }, [pathname, searchParams, router]);

  return null;
}
