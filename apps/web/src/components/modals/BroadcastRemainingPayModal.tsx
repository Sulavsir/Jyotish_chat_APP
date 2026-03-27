/**
 * BroadcastPaymentDetailsModal
 * "Your Payment Details" — always shown before publishing broadcast questions.
 * Displays per-question breakdown, discount info, totals.
 * - Balance sufficient  (remainingNr === 0) → "Publish Now" button calls onPublish()
 * - Balance insufficient (remainingNr  >  0) → "Pay X NRs" button stores payload + redirects to payment
 *
 * Also exports storage helpers used by payment-success page to auto-send after top-up.
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
import { CheckCircle2, Eye, Zap } from 'lucide-react';
import { ROUTES } from '@/constants';
import type { BroadcastPriceBreakdownEntry } from '@/types/broadcast';

// ─── Session-storage helpers (used by payment-success page) ─────────────────

const PENDING_BROADCAST_KEY = 'pendingBroadcastQuestions';

export interface PendingBroadcastPayload {
  questionItems: { id: string; text: string; isCustom?: boolean }[];
  totalNr: number;
  originalTotalNr?: number;
  discountPercentApplied?: number;
  /** Actual admin-configured Q1 discount rate (e.g. 50 for "50% off Q1") */
  firstBroadcastDiscountPct?: number;
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

// ─── Component ───────────────────────────────────────────────────────────────

interface BroadcastPaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-calculated remaining amount; 0 = balance is sufficient */
  remainingNr: number;
  questions: { id: string; text: string; isCustom?: boolean }[];
  /** Full payload used when redirecting to payment page */
  payload: PendingBroadcastPayload;
  /** Called when user clicks "Publish Now" (sufficient balance path) */
  onPublish: () => void | Promise<void>;
  /** Whether the publish action is in progress */
  isPublishing?: boolean;
}

/** @deprecated Use BroadcastPaymentDetailsModal instead */
export function BroadcastRemainingPayModal(props: BroadcastPaymentDetailsModalProps) {
  return <BroadcastPaymentDetailsModal {...props} />;
}

export function BroadcastPaymentDetailsModal({
  isOpen,
  onClose,
  remainingNr,
  questions,
  payload,
  onPublish,
  isPublishing = false,
}: BroadcastPaymentDetailsModalProps) {
  const [previewQuestion, setPreviewQuestion] = React.useState<{
    index: number;
    text: string;
  } | null>(null);
  const hasSufficientBalance = remainingNr === 0;

  const breakdown = payload.breakdown ?? [];
  const hasBreakdown = breakdown.length > 0;
  // Prefer the actual Q1 discount rate; fall back to overall discount pct for display
  const displayDiscountPct =
    payload.firstBroadcastDiscountPct ?? payload.discountPercentApplied ?? 0;
  const hasDiscount = displayDiscountPct > 0;
  const originalTotal = payload.originalTotalNr ?? payload.totalNr;
  const savedAmount = hasDiscount ? originalTotal - payload.totalNr : 0;

  const handlePay = () => {
    storePendingBroadcastQuestions(payload);
    onClose();
    window.location.href = `${ROUTES.PAYMENT}?amount=${remainingNr}&coins=${remainingNr}`;
  };

  const truncateQuestion = (text: string, maxChars = 42) => {
    const normalized = text.trim();
    if (normalized.length <= maxChars) return normalized;
    return `${normalized.slice(0, maxChars).trimEnd()}...`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white w-[95vw] max-w-[95vw] sm:max-w-[545px] max-h-[90dvh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle className="flex items-center gap-2 text-white">
            {hasSufficientBalance ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <Zap className="h-5 w-5 text-amber-400" />
            )}
            Your Payment Details
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {hasSufficientBalance
              ? 'Review your order below, then publish your questions to all Jyotish.'
              : 'Your balance covers part of the cost. Pay the remaining amount to publish.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6 space-y-4">
          {/* Question list */}
          {questions.length > 0 && (
            <div className="rounded-lg bg-slate-800/60 border border-slate-600/60 p-3 max-h-36 overflow-y-auto">
              <p className="text-xs font-medium text-slate-400 mb-2">
                Questions ({questions.length}):
              </p>
              <ul className="list-none text-sm text-slate-200 space-y-1">
                {questions.slice(0, 10).map((q, i) => (
                  <li key={q.id} className="flex items-start gap-1.5">
                    <span className="text-slate-500 shrink-0 text-xs mt-0.5">Q{i + 1}.</span>
                    <span className="flex min-w-0 flex-1 items-center gap-1.5">
                      <span className="min-w-0 truncate break-all">{truncateQuestion(q.text)}</span>
                      <button
                        type="button"
                        onClick={() => setPreviewQuestion({ index: i + 1, text: q.text })}
                        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        aria-label={`View full question ${i + 1}`}
                        title="View full question"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </span>
                    {q.isCustom && (
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                        Custom questions
                      </span>
                    )}
                  </li>
                ))}
                {questions.length > 10 && (
                  <li className="text-slate-400 pl-5">… and {questions.length - 10} more</li>
                )}
              </ul>
            </div>
          )}

          {/* Per-question price breakdown */}
          {hasBreakdown && (
            <div className="rounded-lg bg-slate-800/60 border border-slate-600/60 p-3 space-y-1.5">
              <p className="text-xs font-medium text-slate-400 mb-2">Price breakdown:</p>
              {breakdown.map((entry) => (
                <div key={entry.position} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    Question {entry.position}
                    {entry.isDiscounted && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        🎁 First broadcast
                      </span>
                    )}
                    {entry.tierApplied && !entry.isDiscounted && !entry.isCustom && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                        Custom tier
                      </span>
                    )}
                    {entry.isCustom && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
                        Custom questions
                      </span>
                    )}
                  </span>
                  <span
                    className={
                      entry.isDiscounted ? 'font-semibold text-emerald-300' : 'text-slate-200'
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
                  <span>First question discount ({displayDiscountPct}% off Q1)</span>
                  <span>−{savedAmount} NRs</span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Total</span>
              <span className="font-semibold">{payload.totalNr} NRs</span>
            </div>

            {!hasSufficientBalance && (
              <div className="flex items-center justify-between text-base font-semibold text-white border-t border-slate-600 pt-2 mt-1">
                <span>Remaining to pay</span>
                <span className="text-amber-400">{remainingNr} NRs</span>
              </div>
            )}

            {hasSufficientBalance && (
              <div className="flex items-center justify-between text-sm text-emerald-300 border-t border-slate-600 pt-2 mt-1">
                <span>Your balance covers the full cost</span>
                <CheckCircle2 className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-4 pb-4 sm:px-6 sm:pb-6">
          <Button
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
            onClick={onClose}
            disabled={isPublishing}
          >
            Cancel
          </Button>

          {hasSufficientBalance ? (
            <LoadingButton
              onClick={onPublish}
              loading={isPublishing}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:opacity-90 text-white"
            >
              Publish{' '}
              {questions.length > 0
                ? `${questions.length} Question${questions.length !== 1 ? 's' : ''}`
                : 'Now'}
            </LoadingButton>
          ) : (
            <LoadingButton
              onClick={handlePay}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 text-white"
            >
              Pay {remainingNr} NRs
            </LoadingButton>
          )}
        </div>
      </DialogContent>

      <Dialog open={!!previewQuestion} onOpenChange={(open) => !open && setPreviewQuestion(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white w-fit min-w-[280px] max-w-[92vw] max-h-[70vh] overflow-y-auto overflow-x-hidden p-4">
          {previewQuestion && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-slate-200 border border-white/10">
                  Q{previewQuestion.index}
                </span>
                <p className="text-sm text-slate-200 whitespace-pre-wrap break-all leading-relaxed">
                  {previewQuestion.text}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
