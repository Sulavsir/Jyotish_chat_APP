'use client';

import { Card, CardContent } from '@jyotish/ui';
import { AlertTriangle } from 'lucide-react';
import { PAYMENT_UI } from '@/constants/payment-ui.constants';

interface PaymentChargeDisputeNoticeProps {
  /** Extra tone classes for the card (e.g. dark red theme vs light) */
  className?: string;
}

/**
 * Explains what to do when a gateway reports failure but the user may have been charged — reused on payment-fail and verification-failed views.
 */
export function PaymentChargeDisputeNotice({ className }: PaymentChargeDisputeNoticeProps) {
  return (
    <Card
      className={
        className ??
        'border-amber-500/40 bg-amber-950/30 text-left'
      }
    >
      <CardContent className="pt-6 pb-6 space-y-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-300 flex-shrink-0 mt-0.5" aria-hidden />
          <div className="space-y-2 text-sm leading-relaxed">
            <p className="font-semibold text-amber-100">{PAYMENT_UI.bankDebitTitle}</p>
            <p className="text-amber-50/90">{PAYMENT_UI.bankDebitBody}</p>
            <p className="text-amber-200/80 text-xs">{PAYMENT_UI.supportHint}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
