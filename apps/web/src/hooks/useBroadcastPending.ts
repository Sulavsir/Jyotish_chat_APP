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
    mutationFn: async (messageIdOrFetch: string | null) => {
      if (messageIdOrFetch && messageIdOrFetch !== SENDING_PLACEHOLDER_ID) {
        return broadcastMessageService.cancelMessage(messageIdOrFetch);
      }
      // User cancelled before broadcast:messageSent arrived; find latest PENDING and cancel via API
      const messages = await broadcastMessageService.getMyMessages();
      const now = Date.now();
      const pending = messages
        .filter(
          (m) =>
            m.status === 'PENDING' &&
            new Date(m.createdAt).getTime() + BROADCAST_MESSAGE_EXPIRY_MS > now
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      if (!pending) {
        return null;
      }
      return broadcastMessageService.cancelMessage(pending.id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BROADCAST.MY_MESSAGES });
      if (data != null) {
        toast.success('Request cancelled. Your coin has been refunded.');
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

  // Socket listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('broadcast:messageSent', (msg: BroadcastMessage) => {
      setIsSending(false);
      setIsWaitingForAcceptance(true);
      setPendingMessage(msg);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
      toast.success('Looking for available astrologers...');
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
        toast.success(
          `${data.astrologer?.name || 'An astrologer'} accepted your request! Opening chat...`,
          { description: 'You can now start chatting with your astrologer', duration: 3000 }
        );
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
          description: 'Please top up your coins to send a broadcast message.',
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

    return () => {
      socket.off('broadcast:messageSent');
      socket.off('broadcast:yourMessageAccepted');
      socket.off('broadcast:error');
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
        setIsWaitingForAcceptance(false);
        setPendingMessage(null);
        toast.error('No astrologers available right now. Please try again.');
      }
    };
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [pendingMessage]);

  // Sync pending state on mount
  useEffect(() => {
    // userId comes from auth; we need to run when connected. We don't have userId in deps easily, so rely on isConnected.
    if (!isConnected) return;
    let cancelled = false;
    broadcastMessageService
      .getMyMessages()
      .then((messages) => {
        if (cancelled) return;
        const pending = messages.find(
          (m) =>
            m.status === 'PENDING' &&
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
  }, [isConnected]);

  return {
    isSending,
    setIsSending,
    isWaitingForAcceptance,
    pendingMessage,
    timeRemaining,
    markSending,
    handleCancelRequest,
    isCancelLoading: cancelBroadcastMutation.isPending,
  };
}
