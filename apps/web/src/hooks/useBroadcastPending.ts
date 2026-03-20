/**
 * Shared hook for broadcast "pending + cancel" state used by both
 * Request Instant Chat and Publish to all Jyotish.
 * Ensures cancel always hits the API (including when id is still 'sending').
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSocket } from '@/hooks/useSocket';
import { QUERY_KEYS, ROUTE_BUILDERS } from '@/constants';
import { BROADCAST_MESSAGE_EXPIRY_MS } from '@/constants/broadcastMessage.constants';
import broadcastMessageService from '@/services/broadcastMessage.service';
import type { BroadcastMessage } from '@/types';

const SENDING_PLACEHOLDER_ID = 'sending';

function isMultiQuestionBatch(message: BroadcastMessage): boolean {
  const metadata = (message.metadata ?? {}) as {
    batchId?: string;
    totalInBatch?: number;
  };

  return (
    !!metadata.batchId && typeof metadata.totalInBatch === 'number' && metadata.totalInBatch > 1
  );
}

function extractRequiredCoins(errorMessage: string): number {
  const match = errorMessage.match(/Required:\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 1;
}

export interface UseBroadcastPendingOptions {
  onAccepted?: (data: {
    message: BroadcastMessage;
    chat: { id: string };
    astrologer?: { name?: string };
  }) => void;
  onInsufficientCoins?: (requiredCoins: number) => void;
  /** When false (from dashboard stats), skip initial my-messages fetch on mount */
  hasPendingBroadcast?: boolean;
}

export function useBroadcastPending(options: UseBroadcastPendingOptions = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const [isSending, setIsSending] = useState(false);
  const [isWaitingForAcceptance, setIsWaitingForAcceptance] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<
    BroadcastMessage | (BroadcastMessage & { id: typeof SENDING_PLACEHOLDER_ID }) | null
  >(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const cancelBroadcastMutation = useMutation({
    mutationFn: async (messageIdOrFetch: string | null): Promise<{ refundAmount: number } | null> => {
      // Helper: cancel multiple messages and aggregate total refund
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

      // Fetch all pending messages once — used by both code paths
      const allMessages = await broadcastMessageService.getMyMessages();
      const now = Date.now();
      const activePending = allMessages.filter(
        (m) =>
          m.status === 'PENDING' &&
          new Date(m.createdAt).getTime() + BROADCAST_MESSAGE_EXPIRY_MS > now
      );

      if (messageIdOrFetch && messageIdOrFetch !== SENDING_PLACEHOLDER_ID) {
        // Specific message ID supplied (e.g. instant-chat single message)
        const target = activePending.find((m) => m.id === messageIdOrFetch);
        if (!target) return null;

        if (isMultiQuestionBatch(target)) {
          // Cancel every sibling in the same batch
          const batchId = (target.metadata as Record<string, unknown>)?.batchId as string;
          const siblings = activePending.filter(
            (m) => (m.metadata as Record<string, unknown>)?.batchId === batchId
          );
          return cancelAll(siblings.map((m) => m.id));
        }
        // Plain single message
        const res = await broadcastMessageService.cancelMessage(messageIdOrFetch);
        return { refundAmount: res?.refundAmount ?? 0 };
      }

      // Null / 'sending' placeholder path — determine what is pending and cancel it
      if (activePending.length === 0) return null;

      // Sort newest-first so we operate on the latest broadcast
      const sorted = [...activePending].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const newest = sorted[0];

      if (isMultiQuestionBatch(newest)) {
        // Cancel every message in this batch
        const batchId = (newest.metadata as Record<string, unknown>)?.batchId as string;
        const batchMessages = activePending.filter(
          (m) => (m.metadata as Record<string, unknown>)?.batchId === batchId
        );
        return cancelAll(batchMessages.map((m) => m.id));
      }

      // Single instant-chat message
      const res = await broadcastMessageService.cancelMessage(newest.id);
      return { refundAmount: res?.refundAmount ?? 0 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
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
      setIsSending(false);
      setIsWaitingForAcceptance(false);
      setPendingMessage(null);
    },
  });

  const handleCancelRequest = useCallback(() => {
    if (!pendingMessage) return;
    const id = pendingMessage.id;
    if (id && id !== SENDING_PLACEHOLDER_ID) {
      cancelBroadcastMutation.mutate(id);
    } else {
      // Cancel "sending" or unknown: still hit API by cancelling latest PENDING
      cancelBroadcastMutation.mutate(null);
    }
  }, [pendingMessage, cancelBroadcastMutation]);

  const markSending = useCallback(() => {
    setIsWaitingForAcceptance(true);
    setPendingMessage({
      id: SENDING_PLACEHOLDER_ID,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
    } as BroadcastMessage & { id: typeof SENDING_PLACEHOLDER_ID });
  }, []);

  /** Reset the waiting state without hitting the cancel API (e.g. when the send request itself failed). */
  const clearWaiting = useCallback(() => {
    setIsSending(false);
    setIsWaitingForAcceptance(false);
    setPendingMessage(null);
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('broadcast:messageSent', (msg: BroadcastMessage) => {
      setIsSending(false);
      setIsWaitingForAcceptance(true);
      setPendingMessage(msg);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
      // Toast is shown from the component that initiates the request (to avoid duplicates)
    });

    socket.on(
      'broadcast:yourMessageAccepted',
      (data: {
        message: BroadcastMessage;
        chat: { id: string };
        astrologer: { name?: string };
      }) => {
        setIsSending(false);
        setIsWaitingForAcceptance(false);
        setPendingMessage(null);
        // Refresh balance immediately — chat deduction happens server-side on acceptance
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
        // Toast is shown from the consumer (BroadcastChatWindow / RequestInstantChatButton) to avoid duplicate toasts
        if (options.onAccepted) {
          options.onAccepted(data);
        } else {
          router.push(ROUTE_BUILDERS.CHAT_WITH_ID(data.chat.id));
        }
      }
    );

    socket.on('broadcast:error', (error: { message?: string }) => {
      setIsSending(false);
      setIsWaitingForAcceptance(false);
      setPendingMessage(null);
      const errorMessage = error.message || 'Failed to send message';
      if (
        errorMessage.toLowerCase().includes('insufficient coins') ||
        errorMessage.toLowerCase().includes('required:')
      ) {
        options.onInsufficientCoins?.(extractRequiredCoins(errorMessage));
        toast.error(errorMessage, {
          duration: 5000,
          description: 'Please top up your balance to send a broadcast message.',
        });
      } else if (
        errorMessage.toLowerCase().includes('active chat') ||
        errorMessage.toLowerCase().includes('end your current chat')
      ) {
        toast.error('You have an active chat. End your current chat before starting a new one.', {
          description: 'End your current chat before starting a new one.',
          duration: 5000,
        });
      } else {
        toast.error(errorMessage);
      }
    });

    socket.on('broadcast:messageExpired', (data: { messageId: string; refundAmount: number }) => {
      // Server confirmed expiry + refund; show exact amount to the client
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BROADCAST.MY_MESSAGES });
      const refundNr = data.refundAmount ?? 0;
      if (refundNr > 0) {
        toast.success(
          `Broadcast expired. ${refundNr} NRs have been refunded to your App account.`,
          {
            duration: 5000,
          }
        );
      }
    });

    return () => {
      socket.off('broadcast:messageSent');
      socket.off('broadcast:yourMessageAccepted');
      socket.off('broadcast:error');
      socket.off('broadcast:messageExpired');
    };
  }, [socket, isConnected, queryClient, router, options.onAccepted, options.onInsufficientCoins]);

  // Time remaining for pending message
  useEffect(() => {
    if (!pendingMessage) {
      setTimeRemaining(0);
      return;
    }
    const calculateTimeRemaining = () => {
      const createdAt = new Date(pendingMessage.createdAt).getTime();
      const expiresAt = createdAt + BROADCAST_MESSAGE_EXPIRY_MS;
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeRemaining(remaining);
      if (remaining === 0) {
        setIsSending(false);
        setIsWaitingForAcceptance(false);
        setPendingMessage(null);
        toast.info('Broadcast expired. No one accepted in time.', {
          description: 'Your coins will be refunded shortly.',
          duration: 4000,
        });
      }
    };
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [pendingMessage]);

  // Sync pending state on mount (skip when stats says no pending - avoids redundant my-messages call)
  useEffect(() => {
    if (!isConnected) return;
    if (options.hasPendingBroadcast === false) return;
    let cancelled = false;
    broadcastMessageService
      .getMyMessages()
      .then((messages) => {
        if (cancelled) return;
        const pending = messages.find(
          (m) =>
            m.status === 'PENDING' &&
            !isMultiQuestionBatch(m) &&
            new Date(m.createdAt).getTime() + BROADCAST_MESSAGE_EXPIRY_MS > Date.now()
        );
        if (pending) {
          setIsWaitingForAcceptance(true);
          setPendingMessage(pending);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isConnected, options.hasPendingBroadcast]);

  return {
    isSending,
    setIsSending,
    isWaitingForAcceptance,
    pendingMessage,
    timeRemaining,
    markSending,
    clearWaiting,
    handleCancelRequest,
    isCancelLoading: cancelBroadcastMutation.isPending,
  };
}
