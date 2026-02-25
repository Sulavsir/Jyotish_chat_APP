/**
 * Modal shown when user needs to pay remaining NRs for selected broadcast questions.
 * Lists remaining questions and total; "Pay X NRs" redirects to payment with custom amount.
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

const PENDING_BROADCAST_KEY = 'pendingBroadcastQuestions';

export interface PendingBroadcastPayload {
  questionItems: { id: string; text: string }[];
  totalNr: number;
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
          <div className="rounded-lg bg-slate-800/50 border border-slate-600 p-3 max-h-48 overflow-y-auto">
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
          <p className="text-lg font-semibold text-white">
            Remaining: <span className="text-amber-400">{remainingNr} NRs</span>
          </p>
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
