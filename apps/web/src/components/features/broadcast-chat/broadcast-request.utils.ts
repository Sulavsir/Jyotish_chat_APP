/**
 * Helpers for astrologer broadcast request UI (batch grouping, price from metadata).
 */

import type { BroadcastMessage } from '@/types';

function parseNonNegativeNr(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.round(value);
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const p = parseFloat(value.replace(/,/g, ''));
    if (!Number.isNaN(p) && p >= 0) return Math.round(p);
  }
  return null;
}

/** Per-question Rs. from metadata (refund / price); tolerates string JSON. */
export function getMessageAmountNr(message: BroadcastMessage): number {
  const meta = (message.metadata || {}) as Record<string, unknown>;
  const fromRefund = parseNonNegativeNr(meta.amountRefundNr);
  if (fromRefund !== null) return fromRefund;
  const fromPaid = parseNonNegativeNr(meta.amountPaidNr ?? meta.priceNr);
  return fromPaid ?? 0;
}

/** Total Rs. for a batch (sum of per-question amounts stored on each message). */
export function getBatchTotalNr(messages: BroadcastMessage[]): number {
  const sum = messages.reduce((s, m) => s + getMessageAmountNr(m), 0);
  if (sum > 0) return sum;
  return 0;
}

export function getBatchPreviewText(messages: BroadcastMessage[]): string {
  if (messages.length === 0) return '';
  const first = messages[0]?.content?.trim() || '';
  if (messages.length > 1) {
    return `${first} (+${messages.length - 1} more)`;
  }
  return first;
}

export function sortBroadcastGroupsNewestFirst<T extends { messages: BroadcastMessage[] }>(
  groups: T[]
): T[] {
  return [...groups].sort((a, b) => {
    const aT = Math.max(...a.messages.map((m) => new Date(m.createdAt).getTime()));
    const bT = Math.max(...b.messages.map((m) => new Date(m.createdAt).getTime()));
    return bT - aT;
  });
}

export function getPriceTierClass(totalNr: number, maxNr: number): string {
  if (maxNr <= 0) return '';
  const ratio = totalNr / maxNr;
  if (ratio >= 0.85) {
    return 'ring-2 ring-emerald-400/70 shadow-[0_0_20px_-4px_rgba(52,211,153,0.45)]';
  }
  if (ratio >= 0.55) {
    return 'ring-1 ring-emerald-500/35';
  }
  return '';
}

export function getBroadcastBatchIndex(message: BroadcastMessage): number {
  const meta = (message.metadata || {}) as Record<string, unknown>;
  return typeof meta.batchIndex === 'number' ? meta.batchIndex : 0;
}

export function isFirstBroadcastDiscountQuestion(message: BroadcastMessage): boolean {
  const meta = (message.metadata || {}) as Record<string, unknown>;
  return meta.isFirstBroadcastDiscount === true;
}

/** True if this batch includes the first-broadcast discount offer question(s). */
export function batchHasFirstBroadcastOffer(messages: BroadcastMessage[]): boolean {
  return messages.some((m) => isFirstBroadcastDiscountQuestion(m));
}

/**
 * First question(s) in a batch (batchIndex 0) vs additional paid questions (batchIndex &gt; 0).
 * Prefer {@link splitBroadcastMessagesByPayment} for UI: any question with Rs. &gt; 0 is "paid".
 */
export function splitBroadcastBatchQuestions(messages: BroadcastMessage[]): {
  firstBroadcastOffer: BroadcastMessage[];
  paidAdditional: BroadcastMessage[];
} {
  const sorted = [...messages].sort(
    (a, b) => getBroadcastBatchIndex(a) - getBroadcastBatchIndex(b)
  );
  const firstBroadcastOffer = sorted.filter((m) => getBroadcastBatchIndex(m) === 0);
  const paidAdditional = sorted.filter((m) => getBroadcastBatchIndex(m) > 0);
  return { firstBroadcastOffer, paidAdditional };
}

/** Rs. 0 → free/offer; Rs. &gt; 0 → paid (green section in request detail). */
export function splitBroadcastMessagesByPayment(messages: BroadcastMessage[]): {
  freeOrOffer: BroadcastMessage[];
  paid: BroadcastMessage[];
} {
  const sorted = [...messages].sort(
    (a, b) => getBroadcastBatchIndex(a) - getBroadcastBatchIndex(b)
  );
  const freeOrOffer = sorted.filter((m) => getMessageAmountNr(m) === 0);
  const paid = sorted.filter((m) => getMessageAmountNr(m) > 0);
  return { freeOrOffer, paid };
}
