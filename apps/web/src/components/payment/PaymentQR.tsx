'use client';

import { useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button, LoadingButton } from '@jyotish/ui';
import { useFonepayPayment } from '@/hooks/useFonepayPayment';
import { useFonepayWebSocket } from '@/hooks/useFonepayWebSocket';

export interface PaymentQRProps {
  /** Default amount (NPR) when generating QR */
  defaultAmount?: number;
  /** Remarks1 for Fonepay (e.g. "Jyotish coins") */
  remarks1?: string;
  /** Remarks2 for Fonepay (e.g. order or user ref) */
  remarks2?: string;
  /** Called when payment succeeds */
  onPaymentSuccess?: (prn: string) => void;
  /** Called when payment fails */
  onPaymentFailure?: (prn: string) => void;
}

/**
 * Fonepay Third-Party Dynamic QR payment component.
 * Shows generate button → QR code → WebSocket listener for verification/payment result.
 */
export function PaymentQR({
  defaultAmount = 100,
  remarks1 = 'Jyotish',
  remarks2 = '',
  onPaymentSuccess,
  onPaymentFailure,
}: PaymentQRProps) {
  const {
    state,
    prn,
    qrMessage,
    websocketUrl,
    error,
    generateQr,
    checkStatus,
    reset,
    isGenerating,
    handleWsEvent,
  } = useFonepayPayment({
    onSuccess: onPaymentSuccess,
    onFailure: onPaymentFailure,
  });

  useFonepayWebSocket({
    websocketUrl: state === 'waiting_scan' || state === 'verified' ? websocketUrl : null,
    enabled: state === 'waiting_scan' || state === 'verified',
    onEvent: handleWsEvent,
  });

  const handleGenerate = useCallback(() => {
    const prn = crypto.randomUUID();
    generateQr({
      amount: defaultAmount,
      remarks1,
      remarks2,
      prn,
    });
  }, [defaultAmount, remarks1, remarks2, generateQr]);

  const handleCheckStatus = useCallback(() => {
    if (prn) checkStatus(prn);
  }, [prn, checkStatus]);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-700/50 bg-slate-900/30 p-4">
      {error && (
        <div className="rounded bg-red-950/40 px-3 py-2 text-sm text-red-300" role="alert">
          {error}
        </div>
      )}

      {state === 'idle' && (
        <LoadingButton
          loading={isGenerating}
          loadingText="Generating QR..."
          onClick={handleGenerate}
        >
          Generate QR (NPR {defaultAmount})
        </LoadingButton>
      )}

      {(state === 'waiting_scan' || state === 'verified') && qrMessage && (
        <>
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-lg bg-white p-3">
              <QRCodeSVG value={qrMessage} size={220} level="M" />
            </div>
            <p className="text-sm text-slate-400">
              {state === 'verified' ? 'Payment verified. Completing...' : 'Scan with Fonepay app to pay'}
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCheckStatus}>
              Check status
            </Button>
            <Button variant="ghost" size="sm" onClick={reset}>
              Cancel
            </Button>
          </div>
        </>
      )}

      {state === 'paid' && (
        <div className="rounded bg-green-950/40 px-3 py-2 text-sm text-green-300" role="status">
          Payment successful.
        </div>
      )}

      {state === 'failed' && (
        <div className="flex flex-col gap-2">
          <div className="rounded bg-red-950/40 px-3 py-2 text-sm text-red-300" role="alert">
            Payment failed.
          </div>
          <Button onClick={reset}>Try again</Button>
        </div>
      )}
    </div>
  );
}
