/**
 * Modal shown when user needs to pay remaining NRs for selected broadcast questions.
 * Shows per-question price breakdown, first-broadcast discount, and balance coverage.
 */

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
import { ROUTES } from '@/constants';
import type { BroadcastPriceBreakdownEntry } from '@/types/broadcast';

const PENDING_BROADCAST_KEY = 'pendingBroadcastQuestions';

export interface PendingBroadcastPayload {
  questionItems: { id: string; text: string }[];
  totalNr: number;
  originalTotalNr?: number;
  discountPercentApplied?: number;
  breakdown?: BroadcastPriceBreakdownEntry[];
  birthDetails?: {
    dateOfBirth?: string;
    timeOfBirth?: string;
    placeOfBirth?: string;
    gender?: string;
  };
}

export function storePendingBroadcastQuestions(payload: PendingBroadcastPayload): void {
  try {
    sessionStorage.setItem(PENDING_BROADCAST_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function getPendingBroadcastQuestions(): PendingBroadcastPayload | null {
  try {
    const raw = sessionStorage.getItem(PENDING_BROADCAST_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingBroadcastPayload;
  } catch {
    return null;
  }
}

export function clearPendingBroadcastQuestions(): void {
  try {
    sessionStorage.removeItem(PENDING_BROADCAST_KEY);
  } catch {
    // ignore
  }
}

interface BroadcastRemainingPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  remainingNr: number;
  questions: { id: string; text: string }[];
  payload: PendingBroadcastPayload;
}

export function BroadcastRemainingPayModal({
  isOpen,
  onClose,
  remainingNr,
  questions,
  payload,
}: BroadcastRemainingPayModalProps) {
  const handlePay = () => {
    storePendingBroadcastQuestions(payload);
    onClose();
    window.location.href = `${ROUTES.PAYMENT}?amount=${remainingNr}&coins=${remainingNr}`;
  };

  const breakdown = payload.breakdown ?? [];
  const hasBreakdown = breakdown.length > 0;
  const hasDiscount =
    payload.discountPercentApplied != null && payload.discountPercentApplied > 0;
  const originalTotal = payload.originalTotalNr ?? payload.totalNr;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Pay remaining NRs</DialogTitle>
          <DialogDescription className="text-slate-400">
            Your balance covers part of the cost. Pay the remaining amount to publish these
            questions to all Jyotish.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Question list */}
          <div className="rounded-lg bg-slate-800/50 border border-slate-600 p-3 max-h-36 overflow-y-auto">
            <p className="text-xs text-slate-400 mb-2">Questions ({questions.length}):</p>
            <ul className="list-disc list-inside text-sm text-slate-200 space-y-1">
              {questions.slice(0, 10).map((q) => (
                <li key={q.id} className="truncate">
                  {q.text}
                </li>
              ))}
              {questions.length > 10 && (
                <li className="text-slate-400">... and {questions.length - 10} more</li>
              )}
            </ul>
          </div>

          {/* Per-question price breakdown */}
          {hasBreakdown && (
            <div className="rounded-lg bg-slate-800/50 border border-slate-600 p-3 space-y-1">
              <p className="text-xs text-slate-400 mb-2">Price breakdown:</p>
              {breakdown.map((entry) => (
                <div key={entry.position} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">
                    Question {entry.position}
                    {entry.isDiscounted && (
                      <span className="ml-1.5 text-xs text-emerald-400 font-medium">
                        (first broadcast discount)
                      </span>
                    )}
                    {entry.tierApplied && !entry.isDiscounted && (
                      <span className="ml-1.5 text-xs text-sky-400 font-medium">(custom tier)</span>
                    )}
                  </span>
                  <span
                    className={
                      entry.isDiscounted ? 'text-emerald-300 font-semibold' : 'text-slate-200'
                    }
                  >
                    {entry.price} NRs
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          <div className="space-y-1.5 pt-1">
            {hasDiscount && (
              <>
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Original total</span>
                  <span className="line-through">{originalTotal} NRs</span>
                </div>
                <div className="flex items-center justify-between text-sm text-emerald-300">
                  <span>First question discount ({payload.discountPercentApplied}% on Q1)</span>
                  <span>−{originalTotal - payload.totalNr} NRs</span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Total</span>
              <span className="font-semibold">{payload.totalNr} NRs</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-white border-t border-slate-600 pt-2 mt-1">
              <span>Remaining to pay</span>
              <span className="text-amber-400">{remainingNr} NRs</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" className="border-slate-600" onClick={onClose}>
            Cancel
          </Button>
          <LoadingButton
            onClick={handlePay}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:opacity-90"
          >
            Pay {remainingNr} NRs
          </LoadingButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
