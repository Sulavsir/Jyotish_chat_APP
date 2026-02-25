'use client';

import { useCallback, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@jyotish/ui';
import { useFonepayWebSocket } from '@/hooks/useFonepayWebSocket';
import { paymentService } from '@/services/payment.service';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';

export interface FonepayQRCheckoutProps {
  orderId: string;
  prn: string;
  qrMessage: string;
  websocketUrl: string;
  /** Called after backend verify and coins are credited */
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

/**
 * Displays Fonepay QR from an already-created order; listens to WebSocket and verifies payment.
 * On payment success, calls backend verify-fonepay-qr then onSuccess (e.g. redirect).
 */
export function FonepayQRCheckout({
  orderId,
  prn,
  qrMessage,
  websocketUrl,
  onSuccess,
  onError,
}: FonepayQRCheckoutProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'waiting' | 'verifying' | 'paid' | 'failed'>('waiting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const verifyAndComplete = useCallback(async () => {
    setStatus('verifying');
    setErrorMessage(null);
    try {
      const result = await paymentService.verifyFonepayQr({ prn });
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
        setStatus('paid');
        onSuccess?.();
      } else {
        setStatus('failed');
        setErrorMessage(result.message ?? 'Verification failed');
        onError?.(result.message ?? 'Verification failed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setStatus('failed');
      setErrorMessage(msg);
      onError?.(msg);
    }
  }, [prn, queryClient, onSuccess, onError]);

  useFonepayWebSocket({
    websocketUrl,
    enabled: status === 'waiting',
    onEvent: (event) => {
      if (event.type === 'payment_success') {
        verifyAndComplete();
      } else if (event.type === 'payment_failed') {
        setStatus('failed');
        setErrorMessage('Payment failed.');
        onError?.('Payment failed.');
      }
    },
  });

  if (status === 'paid') {
    return (
      <div className="rounded-lg bg-green-950/40 px-4 py-3 text-sm text-green-300" role="status">
        Payment successful. Redirecting…
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex flex-col gap-2">
        <div className="rounded bg-red-950/40 px-3 py-2 text-sm text-red-300" role="alert">
          {errorMessage ?? 'Payment failed.'}
        </div>
        <Button variant="outline" size="sm" onClick={() => setStatus('waiting')}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-700/50 bg-slate-900/30 p-4">
      <div className="flex flex-col items-center gap-2">
        <div className="rounded-lg bg-white p-3">
          <QRCodeSVG value={qrMessage} size={220} level="M" />
        </div>
        <p className="text-sm text-slate-400">
          {status === 'verifying'
            ? 'Verifying payment…'
            : 'Scan with Fonepay app to pay'}
        </p>
      </div>
      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={verifyAndComplete}
          disabled={status === 'verifying'}
        >
          {status === 'verifying' ? 'Verifying…' : 'Check status'}
        </Button>
      </div>
    </div>
  );
}
