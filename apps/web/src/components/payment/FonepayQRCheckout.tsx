'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@jyotish/ui';
import { useFonepayWebSocket } from '@/hooks/useFonepayWebSocket';
import { paymentService } from '@/services/payment.service';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import { Loader2, CheckCircle2, XCircle, QrCode } from 'lucide-react';

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
  const [status, setStatus] = useState<'waiting' | 'verified' | 'verifying' | 'paid' | 'failed'>('waiting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const verifyingRef = useRef(false);

  const verifyAndComplete = useCallback(async () => {
    // Prevent duplicate verification calls
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    
    setStatus('verifying');
    setErrorMessage(null);
    try {
      const result = await paymentService.verifyFonepayQr({ prn });
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
        setStatus('paid');
        // Small delay before redirect for better UX
        setTimeout(() => {
          onSuccess?.();
        }, 1000);
      } else {
        verifyingRef.current = false;
        setStatus('failed');
        setErrorMessage(result.message ?? 'Verification failed');
        onError?.(result.message ?? 'Verification failed');
      }
    } catch (err) {
      verifyingRef.current = false;
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setStatus('failed');
      setErrorMessage(msg);
      onError?.(msg);
    }
  }, [prn, queryClient, onSuccess, onError]);

  const { isConnected, error: wsError } = useFonepayWebSocket({
    websocketUrl,
    enabled: status === 'waiting' || status === 'verified',
    onEvent: (event) => {
      if (event.type === 'verified') {
        // QR has been scanned, waiting for payment confirmation
        setStatus('verified');
      } else if (event.type === 'payment_success') {
        verifyAndComplete();
      } else if (event.type === 'payment_failed') {
        setStatus('failed');
        setErrorMessage('Payment was cancelled or failed.');
        onError?.('Payment was cancelled or failed.');
      }
    },
  });

  // Auto-redirect after payment success
  useEffect(() => {
    if (status === 'paid' && onSuccess) {
      const timeout = setTimeout(onSuccess, 1500);
      return () => clearTimeout(timeout);
    }
  }, [status, onSuccess]);

  if (status === 'paid') {
    return (
      <div className="rounded-xl border-2 border-green-200 bg-green-50 p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-green-800 mb-2">Payment Successful!</h3>
        <p className="text-green-600">
          <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
          Redirecting to confirmation page…
        </p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Payment Failed</h3>
        <p className="text-red-600 text-sm mb-4">
          {errorMessage ?? 'Something went wrong. Please try again.'}
        </p>
        <Button 
          variant="outline" 
          onClick={() => {
            verifyingRef.current = false;
            setStatus('waiting');
            setErrorMessage(null);
          }}
          className="border-red-300 text-red-700 hover:bg-red-100"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 text-gray-700 font-medium">
          <QrCode className="h-5 w-5 text-red-500" />
          <span>Scan QR to Pay with Fonepay</span>
        </div>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-xl bg-white border-2 border-gray-100 p-4 shadow-sm">
          <QRCodeSVG 
            value={qrMessage} 
            size={200} 
            level="M"
            includeMargin={false}
          />
        </div>

        {/* Status indicator */}
        <div className="text-center">
          {status === 'verifying' ? (
            <div className="flex items-center gap-2 text-amber-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Verifying payment…</span>
            </div>
          ) : status === 'verified' ? (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">QR scanned! Waiting for payment…</span>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Open Fonepay app and scan this QR code
            </p>
          )}
        </div>

        {/* WebSocket status */}
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className={isConnected ? 'text-green-600' : 'text-gray-400'}>
            {isConnected ? 'Connected - waiting for payment' : 'Connecting…'}
          </span>
        </div>

        {wsError && (
          <p className="text-xs text-amber-600">
            Connection issue. You can manually check status below.
          </p>
        )}

        {/* Manual check button */}
        <Button
          variant="outline"
          size="sm"
          onClick={verifyAndComplete}
          disabled={status === 'verifying'}
          className="mt-2"
        >
          {status === 'verifying' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Checking…
            </>
          ) : (
            'Check Payment Status'
          )}
        </Button>
      </div>
    </div>
  );
}
