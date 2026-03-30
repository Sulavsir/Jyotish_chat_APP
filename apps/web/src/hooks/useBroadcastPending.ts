/**
 * Broadcast pending state: global store (see BroadcastPendingBridge) + cancel mutation.
 */

'use client';

import { useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { QUERY_KEYS } from '@/constants';
import broadcastMessageService from '@/services/broadcastMessage.service';
import { isBroadcastPendingStillActive } from '@/utils/broadcastMessage.utils';
import {
  isMultiQuestionBatch,
} from '@/utils/broadcast-pending.utils';
import { useBroadcastPendingStore, SENDING_PLACEHOLDER_ID } from '@/store/broadcast-pending.store';
import type { BroadcastMessage } from '@/types';

export { SENDING_PLACEHOLDER_ID } from '@/store/broadcast-pending.store';

export interface UseBroadcastPendingOptions {
  onAccepted?: (data: {
    message: BroadcastMessage;
    chat: { id: string };
    astrologer?: { name?: string };
  }) => void;
  onInsufficientCoins?: (requiredCoins: number) => void;
  /** @deprecated Hydration always runs; kept for API compatibility */
  hasPendingBroadcast?: boolean;
}

/**
 * Read/write global broadcast pending state + optional insufficient-coin forwarding.
 */
export function useBroadcastPending(options: UseBroadcastPendingOptions = {}) {
  const isSending = useBroadcastPendingStore((s) => s.isSending);
  const setIsSending = useBroadcastPendingStore((s) => s.setIsSending);
  const isWaitingForAcceptance = useBroadcastPendingStore((s) => s.isWaitingForAcceptance);
  const pendingMessage = useBroadcastPendingStore((s) => s.pendingMessage);
  const timeRemaining = useBroadcastPendingStore((s) => s.timeRemaining);
  const markSending = useBroadcastPendingStore((s) => s.markSending);
  const clearWaiting = useBroadcastPendingStore((s) => s.clearWaiting);
  const lastInsufficientCoins = useBroadcastPendingStore((s) => s.lastInsufficientCoins);

  const onInsufficientCoins = options.onInsufficientCoins;

  useEffect(() => {
    if (lastInsufficientCoins != null && onInsufficientCoins) {
      onInsufficientCoins(lastInsufficientCoins);
      useBroadcastPendingStore.getState().clearLastInsufficient();
    }
  }, [lastInsufficientCoins, onInsufficientCoins]);

  return {
    isSending,
    setIsSending,
    isWaitingForAcceptance,
    pendingMessage,
    timeRemaining,
    markSending,
    clearWaiting,
  };
}

export function useBroadcastCancelMutation() {
  const queryClient = useQueryClient();
  const pendingMessage = useBroadcastPendingStore((s) => s.pendingMessage);

  const cancelBroadcastMutation = useMutation({
    mutationFn: async (
      messageIdOrFetch: string | null
    ): Promise<{ refundAmount: number } | null> => {
      const cancelAll = async (ids: string[]): Promise<{ refundAmount: number } | null> => {
        if (ids.length === 0) return null;
        const results = await Promise.allSettled(
          ids.map((id) => broadcastMessageService.cancelMessage(id))
        );
        const totalRefund = results.reduce((sum, r) => {
          if (r.status === 'fulfilled' && r.value) return sum + (r.value.refundAmount ?? 0);
          return sum;
        }, 0);
        return { refundAmount: totalRefund };
      };

      const allMessages = await broadcastMessageService.getMyMessages();
      const activePending = allMessages.filter((m) => isBroadcastPendingStillActive(m));

      if (messageIdOrFetch && messageIdOrFetch !== SENDING_PLACEHOLDER_ID) {
        const target = activePending.find((m) => m.id === messageIdOrFetch);
        if (!target) return null;

        if (isMultiQuestionBatch(target)) {
          const batchId = (target.metadata as Record<string, unknown>)?.batchId as string;
          const siblings = activePending.filter(
            (m) => (m.metadata as Record<string, unknown>)?.batchId === batchId
          );
          return cancelAll(siblings.map((m) => m.id));
        }
        const res = await broadcastMessageService.cancelMessage(messageIdOrFetch);
        return { refundAmount: res?.refundAmount ?? 0 };
      }

      if (activePending.length === 0) return null;

      const sorted = [...activePending].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const newest = sorted[0];

      if (isMultiQuestionBatch(newest)) {
        const batchId = (newest.metadata as Record<string, unknown>)?.batchId as string;
        const batchMessages = activePending.filter(
          (m) => (m.metadata as Record<string, unknown>)?.batchId === batchId
        );
        return cancelAll(batchMessages.map((m) => m.id));
      }

      const res = await broadcastMessageService.cancelMessage(newest.id);
      return { refundAmount: res?.refundAmount ?? 0 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
      queryClient.invalidateQueries({ queryKey: ['client-dashboard', 'stats'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BROADCAST.MY_MESSAGES });
      if (data != null) {
        const refundNr = data.refundAmount ?? 0;
        if (refundNr > 0) {
          toast.success(`Request cancelled. ${refundNr} NRs have been refunded to your account.`);
        } else {
          toast.success('Request cancelled. Your balance has been refunded.');
        }
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel request. You can try again.');
    },
    onSettled: () => {
      useBroadcastPendingStore.getState().clearPending();
    },
  });

  const handleCancelRequest = useCallback(() => {
    if (!pendingMessage) return;
    const id = pendingMessage.id;
    if (id && id !== SENDING_PLACEHOLDER_ID) {
      cancelBroadcastMutation.mutate(id);
    } else {
      cancelBroadcastMutation.mutate(null);
    }
  }, [pendingMessage, cancelBroadcastMutation]);

  return { handleCancelRequest, isCancelLoading: cancelBroadcastMutation.isPending };
}
