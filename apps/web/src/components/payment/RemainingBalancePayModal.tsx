'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  LoadingButton,
} from '@jyotish/ui';
import { CheckCircle2, Zap } from 'lucide-react';

export interface BalancePayLine {
  label: string;
  value: string;
}

export interface RemainingBalancePayModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  totalNr: number;
  balance: number;
  remainingNr: number;
  extraLines?: BalancePayLine[];
  /** When balance covers the full amount */
  onConfirm: () => void | Promise<void>;
  /** When user must add balance first — redirect to payment */
  onPayRemaining: () => void;
  isConfirming?: boolean;
  confirmButtonText?: string;
  payButtonText?: string;
}

/**
 * Generic “payment details” modal: full amount vs wallet balance vs remaining (same pattern as broadcast).
 */
export function RemainingBalancePayModal({
  isOpen,
  onClose,
  title,
  description,
  totalNr,
  balance,
  remainingNr,
  extraLines = [],
  onConfirm,
  onPayRemaining,
  isConfirming = false,
  confirmButtonText = 'Confirm',
  payButtonText,
}: RemainingBalancePayModalProps) {
  const hasSufficientBalance = remainingNr === 0;
  const payLabel =
    payButtonText ?? (remainingNr > 0 ? `Pay ${remainingNr} NRs` : 'Pay');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            {hasSufficientBalance ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <Zap className="h-5 w-5 text-amber-400" />
            )}
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="text-slate-400">{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Total (NRs)</span>
            <span className="font-semibold text-white">{totalNr}</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Your balance</span>
            <span className="font-semibold text-sky-300">{balance}</span>
          </div>
          {!hasSufficientBalance && (
            <div className="flex justify-between gap-4 text-amber-200 border border-amber-500/30 rounded-lg px-3 py-2 bg-amber-500/10">
              <span>Remaining to pay</span>
              <span className="font-semibold">{remainingNr} NRs</span>
            </div>
          )}
          {extraLines.map((line) => (
            <div key={line.label} className="flex justify-between gap-4 text-slate-400 text-xs">
              <span>{line.label}</span>
              <span className="text-slate-200">{line.value}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {hasSufficientBalance ? (
            <LoadingButton
              type="button"
              onClick={() => void onConfirm()}
              loading={isConfirming}
              loadingText="Processing..."
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {confirmButtonText}
            </LoadingButton>
          ) : (
            <Button
              type="button"
              onClick={onPayRemaining}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              {payLabel}
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
