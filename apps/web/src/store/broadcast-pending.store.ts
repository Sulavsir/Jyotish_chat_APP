'use client';

import { create } from 'zustand';
import type { BroadcastMessage } from '@/types';
import { BROADCAST_MESSAGE_EXPIRY_MS } from '@/constants/broadcastMessage.constants';
import { isMultiQuestionBatch, pickPendingBroadcastMessage } from '@/utils/broadcast-pending.utils';

export const SENDING_PLACEHOLDER_ID = 'sending' as const;

export type PendingBroadcastMessage =
  | BroadcastMessage
  | (BroadcastMessage & { id: typeof SENDING_PLACEHOLDER_ID });

interface BroadcastPendingState {
  isSending: boolean;
  isWaitingForAcceptance: boolean;
  pendingMessage: PendingBroadcastMessage | null;
  timeRemaining: number;
  isMinimized: boolean;
  isBatchBroadcast: boolean;
  /** Set by bridge on broadcast:error (insufficient balance) for consumers to open purchase modal */
  lastInsufficientCoins: number | null;

  setIsSending: (v: boolean) => void;
  setTimeRemaining: (s: number) => void;
  setMinimized: (v: boolean) => void;
  clearLastInsufficient: () => void;

  markSending: () => void;
  clearWaiting: () => void;

  applyMessageSent: (msg: BroadcastMessage, opts?: { isBatch?: boolean }) => void;
  applyQuestionsSent: (messages: BroadcastMessage[], totalNr: number) => void;
  hydrateFromMessages: (messages: BroadcastMessage[]) => void;
  clearPending: () => void;
}

export const useBroadcastPendingStore = create<BroadcastPendingState>((set, get) => ({
  isSending: false,
  isWaitingForAcceptance: false,
  pendingMessage: null,
  timeRemaining: 0,
  isMinimized: false,
  isBatchBroadcast: false,
  lastInsufficientCoins: null,

  setIsSending: (v) => set({ isSending: v }),
  setTimeRemaining: (timeRemaining) => set({ timeRemaining }),
  setMinimized: (isMinimized) => set({ isMinimized }),
  clearLastInsufficient: () => set({ lastInsufficientCoins: null }),

  markSending: () =>
    set({
      isWaitingForAcceptance: true,
      isSending: true,
      pendingMessage: {
        id: SENDING_PLACEHOLDER_ID,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + BROADCAST_MESSAGE_EXPIRY_MS).toISOString(),
        status: 'PENDING',
      } as PendingBroadcastMessage,
      isBatchBroadcast: false,
    }),

  clearWaiting: () =>
    set({
      isSending: false,
      isWaitingForAcceptance: false,
      pendingMessage: null,
      timeRemaining: 0,
      isMinimized: false,
      isBatchBroadcast: false,
    }),

  applyMessageSent: (msg, opts) =>
    set({
      isSending: false,
      isWaitingForAcceptance: true,
      pendingMessage: msg,
      isBatchBroadcast: opts?.isBatch ?? isMultiQuestionBatch(msg),
    }),

  applyQuestionsSent: (messages, _totalNr) => {
    const first = messages[0];
    if (!first) return;
    set({
      isSending: false,
      isWaitingForAcceptance: true,
      pendingMessage: first,
      isBatchBroadcast: messages.length > 1 || isMultiQuestionBatch(first),
    });
  },

  hydrateFromMessages: (messages) => {
    if (get().pendingMessage?.id === SENDING_PLACEHOLDER_ID) {
      return;
    }
    const picked = pickPendingBroadcastMessage(messages);
    if (!picked) {
      set({
        isSending: false,
        isWaitingForAcceptance: false,
        pendingMessage: null,
        timeRemaining: 0,
        isBatchBroadcast: false,
      });
      return;
    }
    set({
      isWaitingForAcceptance: true,
      isSending: false,
      pendingMessage: picked,
      isBatchBroadcast: isMultiQuestionBatch(picked),
    });
  },

  clearPending: () =>
    set({
      isSending: false,
      isWaitingForAcceptance: false,
      pendingMessage: null,
      timeRemaining: 0,
      isMinimized: false,
      isBatchBroadcast: false,
    }),
}));
