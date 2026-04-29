/**
 * Keeps broadcast "searching for Jyotish" UI and socket sync alive across dashboard routes and refresh.
 * Must render inside ClientDashboardProvider (client role).
 */

'use client';

import { useEffect, useRef } from 'react';
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
import { BroadcastMessageStatus } from '@/types/broadcast';
import type {
  BroadcastMessageExpiredPayload,
  BroadcastYourMessageAcceptedPayload,
} from '@jyotish/shared';
import { playBroadcastTimerEndSound } from '@/utils/broadcast-timer-sound.utils';
import { BROADCAST_POST_EXPIRY_GRACE_MS } from '@/constants/broadcastMessage.constants';

function extractRequiredCoins(errorMessage: string): number {
  const match = errorMessage.match(/Required:\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 1;
}

function findAcceptedChatForPending(
  messages: BroadcastMessage[],
  pending: BroadcastMessage
): { chatId: string; astrologerName?: string } | null {
  const meta = (pending.metadata ?? {}) as { batchId?: string };
  const batchId = typeof meta.batchId === 'string' ? meta.batchId : null;
  const acceptedRows = messages.filter(
    (m) => m.status === BroadcastMessageStatus.ACCEPTED && m.chatId
  );
  if (batchId) {
    const row = acceptedRows.find(
      (m) => ((m.metadata ?? {}) as { batchId?: string }).batchId === batchId
    );
    if (row?.chatId) {
      return { chatId: row.chatId, astrologerName: row.acceptedAstrologer?.name };
    }
  }
  const row = acceptedRows.find((m) => m.id === pending.id);
  if (row?.chatId) {
    return { chatId: row.chatId, astrologerName: row.acceptedAstrologer?.name };
  }
  return null;
}

function clientAcceptanceToastCopy(
  name: string,
  payload: Pick<BroadcastYourMessageAcceptedPayload, 'autoAssignedFromTimer' | 'assignedByAdmin'>
): { title: string; description?: string } {
  if (payload.autoAssignedFromTimer) {
    return {
      title: `We've connected you with ${name} for your convenience.`,
      description: 'Opening your chat now...',
    };
  }
  if (payload.assignedByAdmin) {
    return {
      title: `${name} is ready to help you - opening chat...`,
      description: 'An advisor was matched to your request.',
    };
  }
  return {
    title: `${name} accepted your request! Opening chat...`,
  };
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
  const timerSoundPlayedForId = useRef<string | null>(null);
  const pollGeneration = useRef(0);
  const recentClientAcceptanceRef = useRef<{ at: number; chatId: string } | null>(null);

  /** Suppress duplicate success toasts when socket + REST poll both fire; still navigate below. */
  const shouldSuppressDuplicateAcceptanceToast = (chatId: string): boolean => {
    const now = Date.now();
    const r = recentClientAcceptanceRef.current;
    if (r && r.chatId === chatId && now - r.at < 4000) {
      return true;
    }
    recentClientAcceptanceRef.current = { at: now, chatId };
    return false;
  };

  useEffect(() => {
    if (!pendingMessage) {
      timerSoundPlayedForId.current = null;
    }
  }, [pendingMessage]);

  // Countdown timer (do not clear pending at zero — server may still auto-assign)
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
        if (timerSoundPlayedForId.current !== pendingMessage.id) {
          timerSoundPlayedForId.current = pendingMessage.id;
          playBroadcastTimerEndSound();
        }
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pendingMessage, setTimeRemaining]);

  // After countdown hits zero, poll REST briefly so UI updates even if the socket event is delayed.
  // Do not require socket `isConnected` — assignment + expiry are persisted server-side.
  useEffect(() => {
    if (role !== 'CLIENT') return;
    if (!pendingMessage || pendingMessage.id === SENDING_PLACEHOLDER_ID) return;
    if (getBroadcastExpiresAtMs(pendingMessage) > Date.now()) return;

    const myGen = ++pollGeneration.current;
    const pendingId = pendingMessage.id;
    const maxAttempts = Math.ceil(BROADCAST_POST_EXPIRY_GRACE_MS / 2000);
    let attempts = 0;

    const run = async () => {
      if (pollGeneration.current !== myGen) return;
      try {
        const messages = await broadcastMessageService.getMyMessages();
        if (pollGeneration.current !== myGen) return;
        const state = useBroadcastPendingStore.getState();
        if (state.pendingMessage?.id === SENDING_PLACEHOLDER_ID) return;
        if (state.pendingMessage?.id !== pendingId) return;

        const pm = state.pendingMessage as BroadcastMessage;
        const accepted = findAcceptedChatForPending(messages, pm);
        if (accepted) {
          useBroadcastPendingStore.getState().clearPending();
          void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
          void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BROADCAST.MY_MESSAGES });
          void refetchClientBalanceAndStats(queryClient);
          void useAuthStore.getState().refreshUser();
          const name = accepted.astrologerName || 'a Jyotish';
          if (!shouldSuppressDuplicateAcceptanceToast(accepted.chatId)) {
            const { title, description } = clientAcceptanceToastCopy(name, {
              autoAssignedFromTimer: true,
            });
            toast.success(title, { duration: 4000, ...(description ? { description } : {}) });
          }
          router.push(ROUTE_BUILDERS.CHAT_WITH_ID(accepted.chatId));
          return;
        }

        state.hydrateFromMessages(messages);
      } catch {
        // non-fatal
      }
    };

    void run();
    const interval = setInterval(() => {
      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        return;
      }
      void run();
    }, 2000);

    return () => {
      if (pollGeneration.current === myGen) {
        pollGeneration.current++;
      }
      clearInterval(interval);
    };
  }, [
    role,
    pendingMessage?.id,
    pendingMessage?.expiresAt,
    pendingMessage?.createdAt,
    queryClient,
    router,
  ]);

  // Hydrate pending broadcast from API (refresh / navigation / dashboard)
  useEffect(() => {
    if (role !== 'CLIENT') return;
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
  }, [role]);

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

    const onAccepted = (data: BroadcastYourMessageAcceptedPayload) => {
      useBroadcastPendingStore.getState().clearPending();
      const chatId = data.chat?.id;
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BROADCAST.MY_MESSAGES });
      void refetchClientBalanceAndStats(queryClient);
      const name = data.astrologer?.name || 'a Jyotish';
      if (!(chatId && shouldSuppressDuplicateAcceptanceToast(chatId))) {
        const { title, description } = clientAcceptanceToastCopy(name, data);
        toast.success(title, { duration: 4000, ...(description ? { description } : {}) });
      }
      if (chatId) {
        router.push(ROUTE_BUILDERS.CHAT_WITH_ID(chatId));
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

    const onExpired = (data: BroadcastMessageExpiredPayload) => {
      if (data.soundCue === 'timer_end' && timerSoundPlayedForId.current !== data.messageId) {
        timerSoundPlayedForId.current = data.messageId;
        playBroadcastTimerEndSound();
      }
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
      // Multi-question batches emit one expiry per row; re-hydrate so the modal clears for any sibling id.
      void broadcastMessageService
        .getMyMessages()
        .then((messages) => useBroadcastPendingStore.getState().hydrateFromMessages(messages))
        .catch(() => {});
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

  const showConnectingCopy = timeRemaining === 0 && pendingMessage.id !== SENDING_PLACEHOLDER_ID;

  return (
    <JyotishMatchingModal
      isOpen
      onCancel={handleCancelRequest}
      timeRemaining={timeRemaining}
      title="Searching for Available Jyotish"
      subtitle={
        showConnectingCopy
          ? "Hang tight - we're connecting you with a Jyotish now."
          : isBatchBroadcast
            ? 'Your questions have been published to all Jyotish. Waiting for one to accept...'
            : 'Your message has been broadcasted. Waiting for an astrologer to accept...'
      }
      minimized={isMinimized}
      onMinimizeChange={setMinimized}
    />
  );
}
