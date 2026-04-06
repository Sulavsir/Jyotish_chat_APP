/**
 * Keeps broadcast "searching for Jyotish" UI and socket sync alive across dashboard routes and refresh.
 * Must render inside ClientDashboardProvider (client role).
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSocket } from '@/hooks/useSocket';
import { QUERY_KEYS, ROUTE_BUILDERS } from '@/constants';
import { useAuthStore } from '@/store/auth-store';
import broadcastMessageService from '@/services/broadcastMessage.service';
import { useBroadcastPendingStore, SENDING_PLACEHOLDER_ID } from '@/store/broadcast-pending.store';
import { getBroadcastExpiresAtMs } from '@/utils/broadcastMessage.utils';
import { refetchClientBalanceAndStats } from '@/utils/query.utils';
import { JyotishMatchingModal } from '@/components/ui/JyotishMatchingModal';
import { useBroadcastCancelMutation } from '@/hooks/useBroadcastPending';
import type { BroadcastMessage } from '@/types';

function extractRequiredCoins(errorMessage: string): number {
  const match = errorMessage.match(/Required:\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 1;
}

export function BroadcastPendingBridge() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  const isWaitingForAcceptance = useBroadcastPendingStore((s) => s.isWaitingForAcceptance);
  const pendingMessage = useBroadcastPendingStore((s) => s.pendingMessage);
  const timeRemaining = useBroadcastPendingStore((s) => s.timeRemaining);
  const isMinimized = useBroadcastPendingStore((s) => s.isMinimized);
  const isBatchBroadcast = useBroadcastPendingStore((s) => s.isBatchBroadcast);
  const setMinimized = useBroadcastPendingStore((s) => s.setMinimized);
  const setTimeRemaining = useBroadcastPendingStore((s) => s.setTimeRemaining);

  const { handleCancelRequest } = useBroadcastCancelMutation();

  // Countdown timer
  useEffect(() => {
    if (!pendingMessage) {
      setTimeRemaining(0);
      return;
    }
    const tick = () => {
      const expiresAt = getBroadcastExpiresAtMs(pendingMessage);
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeRemaining(remaining);
      if (remaining === 0 && pendingMessage.id !== SENDING_PLACEHOLDER_ID) {
        useBroadcastPendingStore.getState().clearPending();
        toast.info('Broadcast expired. No one accepted in time.', {
          description: 'Your coins will be refunded shortly.',
          duration: 4000,
        });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pendingMessage, setTimeRemaining]);

  // Hydrate pending broadcast from API (refresh / navigation / dashboard)
  useEffect(() => {
    if (role !== 'CLIENT' || !isConnected) return;
    let cancelled = false;
    broadcastMessageService
      .getMyMessages()
      .then((messages) => {
        if (cancelled) return;
        const state = useBroadcastPendingStore.getState();
        if (state.pendingMessage?.id === SENDING_PLACEHOLDER_ID) return;
        state.hydrateFromMessages(messages);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [role, isConnected]);

  // Socket: single source of truth for broadcast events (client)
  useEffect(() => {
    if (!socket || !isConnected || role !== 'CLIENT') return;

    const onMessageSent = (msg: BroadcastMessage) => {
      useBroadcastPendingStore.getState().applyMessageSent(msg, { isBatch: false });
      // Deduction happens on send; show immediately (balance cache also invalidated below)
      const meta = (msg.metadata ?? {}) as { amountRefundNr?: number };
      const amount = typeof meta.amountRefundNr === 'number' ? meta.amountRefundNr : 0;
      if (amount > 0) {
        toast.info(`${amount} NRs deducted from your balance`, { duration: 4000 });
      }
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
      void queryClient.invalidateQueries({ queryKey: ['client-dashboard', 'stats'] });
      void refetchClientBalanceAndStats(queryClient);
      void useAuthStore.getState().refreshUser();
    };

    const onQuestionsSent = (payload: { messages: BroadcastMessage[]; totalNr: number }) => {
      const { messages, totalNr } = payload;
      if (!messages?.length) return;
      useBroadcastPendingStore.getState().applyQuestionsSent(messages, totalNr);
      // Deduction toast: send-questions HTTP mutation shows it (avoids double toast with REST response)
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
      void queryClient.invalidateQueries({ queryKey: ['client-dashboard', 'stats'] });
      void refetchClientBalanceAndStats(queryClient);
      void useAuthStore.getState().refreshUser();
    };

    const onAccepted = (data: {
      message: BroadcastMessage;
      chat: { id: string };
      astrologer?: { name?: string };
    }) => {
      useBroadcastPendingStore.getState().clearPending();
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
      void refetchClientBalanceAndStats(queryClient);
      const name = data.astrologer?.name || 'An astrologer';
      toast.success(`${name} accepted your request! Opening chat…`, { duration: 3500 });
      if (data.chat?.id) {
        router.push(ROUTE_BUILDERS.CHAT_WITH_ID(data.chat.id));
      }
    };

    const onError = (error: { message?: string }) => {
      useBroadcastPendingStore.getState().clearWaiting();
      const errorMessage = error.message || 'Failed to send message';
      if (
        errorMessage.toLowerCase().includes('insufficient balance') ||
        errorMessage.toLowerCase().includes('required:')
      ) {
        useBroadcastPendingStore.setState({
          lastInsufficientCoins: extractRequiredCoins(errorMessage),
        });
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
    };

    const onExpired = (data: { messageId: string; refundAmount: number }) => {
      const current = useBroadcastPendingStore.getState().pendingMessage;
      if (current && current.id !== SENDING_PLACEHOLDER_ID && current.id === data.messageId) {
        useBroadcastPendingStore.getState().clearPending();
      }
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
      void queryClient.invalidateQueries({ queryKey: ['client-dashboard', 'stats'] });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BROADCAST.MY_MESSAGES });
      const refundNr = data.refundAmount ?? 0;
      if (refundNr > 0) {
        toast.success(
          `Broadcast expired. ${refundNr} NRs have been refunded to your App account.`,
          {
            duration: 5000,
          }
        );
      }
    };

    socket.on('broadcast:messageSent', onMessageSent);
    socket.on('broadcast:questionsSent', onQuestionsSent);
    socket.on('broadcast:yourMessageAccepted', onAccepted);
    socket.on('broadcast:error', onError);
    socket.on('broadcast:messageExpired', onExpired);

    return () => {
      socket.off('broadcast:messageSent', onMessageSent);
      socket.off('broadcast:questionsSent', onQuestionsSent);
      socket.off('broadcast:yourMessageAccepted', onAccepted);
      socket.off('broadcast:error', onError);
      socket.off('broadcast:messageExpired', onExpired);
    };
  }, [socket, isConnected, role, queryClient, router]);

  if (role !== 'CLIENT' || !isWaitingForAcceptance || !pendingMessage) {
    return null;
  }

  return (
    <JyotishMatchingModal
      isOpen
      onCancel={handleCancelRequest}
      timeRemaining={timeRemaining}
      title="Searching for Available Jyotish"
      subtitle={
        isBatchBroadcast
          ? 'Your questions have been published to all Jyotish. Waiting for one to accept...'
          : 'Your message has been broadcast. Waiting for an astrologer to accept...'
      }
      minimized={isMinimized}
      onMinimizeChange={setMinimized}
    />
  );
}
