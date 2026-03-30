/**
 * Broadcast Message Bar (for Astrologers)
 * Displays broadcast messages from clients as popup notifications
 * Similar to InstantChatRequestBar
 */

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Avatar, AvatarImage, AvatarFallback, Card } from '@jyotish/ui';
import { LoadingButton } from '@/components/ui';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/auth-store';
import type { BroadcastMessage } from '@/types';
import broadcastMessageService from '@/services/broadcastMessage.service';
import { toast } from 'sonner';
import { MessageSquare, User, X, Minus, Maximize2 } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { getImageUrl } from '@/utils/image.utils';
import { useRouter } from 'next/navigation';
import { ROUTE_BUILDERS } from '@/constants';
import { BROADCAST_MESSAGE_EXPIRY_MS } from '@/constants/broadcastMessage.constants';
import { SidebarRequestList } from './SidebarRequestList';
import { ProgressBar } from './ProgressBar';
import {
  getBatchTotalNr,
  getMessageAmountNr,
  getPriceTierClass,
  sortBroadcastGroupsNewestFirst,
  splitBroadcastMessagesByPayment,
  isFirstBroadcastDiscountQuestion,
} from './broadcast-request.utils';
import { isBroadcastPendingStillActive } from '@/utils/broadcastMessage.utils';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';

export interface BroadcastMessageBarProps {
  onHasItemsChange?: (hasPending: boolean) => void;
}

export function BroadcastMessageBar({ onHasItemsChange }: BroadcastMessageBarProps) {
  const { socket, isConnected } = useSocket();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const [pendingMessages, setPendingMessages] = useState<BroadcastMessage[]>([]);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [messageIdToDiscard, setMessageIdToDiscard] = useState<string | null>(null);
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);
  const [detailExpired, setDetailExpired] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null);

  function handleDragMouseDown(event: React.MouseEvent) {
    const target = event.target as HTMLElement;
    if (
      target.closest(
        'button,a,input,textarea,select,[data-no-drag],[role="button"],[role="slider"]'
      )
    ) {
      return;
    }
    isDraggingRef.current = true;
    lastMousePositionRef.current = { x: event.clientX, y: event.clientY };
    event.preventDefault();
  }

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      if (!isDraggingRef.current || !lastMousePositionRef.current) return;

      const deltaX = event.clientX - lastMousePositionRef.current.x;
      const deltaY = event.clientY - lastMousePositionRef.current.y;

      setPosition((prev) => {
        const rawX = prev.x + deltaX;
        const rawY = prev.y + deltaY;

        if (typeof window === 'undefined') {
          return { x: rawX, y: rawY };
        }

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const cardWidth = 440;
        const margin = 16;

        const minX = -(viewportWidth - cardWidth - margin);
        const maxX = 0;

        const headerHeight = 120;
        const minY = -(viewportHeight - headerHeight - margin);
        const maxY = 0;

        const clampedX = Math.min(Math.max(rawX, minX), maxX);
        const clampedY = Math.min(Math.max(rawY, minY), maxY);

        return { x: clampedX, y: clampedY };
      });

      lastMousePositionRef.current = { x: event.clientX, y: event.clientY };
    }

    function handleMouseUp() {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      lastMousePositionRef.current = null;
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Setup socket listeners
  useEffect(() => {
    if (!socket || !isConnected || user?.role !== 'ASTROLOGER') return;

    // Initial pending list (no HTTP polling)
    socket.emit('broadcast:getPendingMessages');

    socket.on('broadcast:pendingMessages', (messages: BroadcastMessage[]) => {
      setPendingMessages(messages || []);
    });

    // New broadcast message received
    socket.on('broadcast:newMessage', (message: BroadcastMessage) => {
      setPendingMessages((prev) => {
        // Check if message already exists
        if (prev.find((m) => m.id === message.id)) {
          return prev;
        }

        const meta = (message.metadata || {}) as Record<string, unknown>;
        const batchId = typeof meta.batchId === 'string' ? meta.batchId : null;

        // Only show one toast per batch
        const hasBatchAlready =
          batchId &&
          prev.some((m) => {
            const existingMeta = (m.metadata || {}) as Record<string, unknown>;
            return existingMeta.batchId === batchId;
          });

        if (!hasBatchAlready) {
          toast.info(
            `New broadcast from ${message.client?.name || message.client?.phone || 'Client'}`
          );
        }

        return [message, ...prev];
      });
    });

    // Message was accepted by an astrologer - remove entire batch immediately
    socket.on(
      'broadcast:messageAcceptedByAstrologer',
      (data: {
        messageId: string;
        allAcceptedMessageIds?: string[];
        acceptedBy: { id: string; name?: string };
        acceptedAt: string;
        clientName: string;
      }) => {
        setPendingMessages((prev) => {
          // Build a Set of all IDs to remove (server-provided list + batchId fallback)
          const removeIds = new Set<string>(data.allAcceptedMessageIds ?? [data.messageId]);

          // Also remove any siblings sharing the same batchId as the primary message
          const target = prev.find((m) => m.id === data.messageId);
          const meta = (target?.metadata || {}) as Record<string, unknown>;
          const batchId = typeof meta.batchId === 'string' ? meta.batchId : null;
          if (batchId) {
            prev.forEach((m) => {
              const mMeta = (m.metadata || {}) as Record<string, unknown>;
              if (mMeta.batchId === batchId) removeIds.add(m.id);
            });
          }

          return prev.filter((m) => !removeIds.has(m.id));
        });
        if (data.acceptedBy.id !== user?.id) {
          toast.info('This request was accepted by another astrologer');
        }
      }
    );

    // Client cancelled their broadcast - remove immediately
    socket.on('broadcast:messageCancelled', (data: { messageId: string }) => {
      setPendingMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    });

    // Server expired the request (timer / refund) — same as cancel for astrologer UI
    socket.on('broadcast:messageExpired', (data: { messageId: string }) => {
      const id = data?.messageId;
      if (!id) return;
      setPendingMessages((prev) => prev.filter((m) => m.id !== id));
    });

    // My acceptance was successful - remove entire batch immediately
    socket.on(
      'broadcast:messageAccepted',
      (data: {
        message?: { id: string };
        allAcceptedMessageIds?: string[];
        chat?: { id: string };
      }) => {
        if (data.message?.id) {
          setPendingMessages((prev) => {
            const removeIds = new Set<string>(data.allAcceptedMessageIds ?? [data.message!.id]);

            // Also catch siblings via batchId in case server list is incomplete
            const target = prev.find((m) => m.id === data.message!.id);
            const meta = (target?.metadata || {}) as Record<string, unknown>;
            const batchId = typeof meta.batchId === 'string' ? meta.batchId : null;
            if (batchId) {
              prev.forEach((m) => {
                const mMeta = (m.metadata || {}) as Record<string, unknown>;
                if (mMeta.batchId === batchId) removeIds.add(m.id);
              });
            }

            return prev.filter((m) => !removeIds.has(m.id));
          });
        }
        setAccepting(null);
        if (data.chat) {
          toast.success('Chat started successfully!');
          router.push(ROUTE_BUILDERS.JYOTISH_CHAT_WITH_ID(data.chat.id));
        }
      }
    );

    socket.on('broadcast:error', (error: { message?: string }) => {
      const messageText = error.message || 'Something went wrong';

      // If this request was already accepted or expired, just refresh from server
      if (
        messageText.toLowerCase().includes('accepted') &&
        messageText.toLowerCase().includes('expired')
      ) {
        socket.emit('broadcast:getPendingMessages');
        toast.info(
          'This request has already been accepted or expired. Please watch out for new requests.'
        );
        setAccepting(null);
        return;
      }

      toast.error(messageText);
      setAccepting(null);
    });

    return () => {
      socket.off('broadcast:pendingMessages');
      socket.off('broadcast:newMessage');
      socket.off('broadcast:messageAcceptedByAstrologer');
      socket.off('broadcast:messageCancelled');
      socket.off('broadcast:messageExpired');
      socket.off('broadcast:messageAccepted');
      socket.off('broadcast:error');
    };
  }, [socket, isConnected, user, router]);

  // Drop from bar when local clock passes expiresAt (no socket yet / missed event)
  useEffect(() => {
    if (user?.role !== 'ASTROLOGER') return;
    const t = setInterval(() => {
      setPendingMessages((prev) => prev.filter((m) => isBroadcastPendingStillActive(m)));
    }, 2000);
    return () => clearInterval(t);
  }, [user?.role]);

  async function handleAccept(messageId: string) {
    if (!socket || !isConnected) {
      toast.error('Not connected to server');
      return;
    }

    try {
      setAccepting(messageId);
      setDetailOpen(false);

      // Emit via socket
      socket.emit('broadcast:acceptMessage', { messageId });
    } catch (error) {
      console.error('Error accepting broadcast message:', error);
      toast.error('Failed to accept message');
      setAccepting(null);
    }
  }

  async function handleDismiss(messageId: string) {
    try {
      setPendingMessages((prev) => prev.filter((m) => m.id !== messageId));
      setMessageIdToDiscard(null);

      await broadcastMessageService.dismissMessage(messageId);

      toast.success('Request declined successfully');
    } catch (error: any) {
      console.error('Error dismissing broadcast message:', error);
      toast.error(error.message || 'Failed to dismiss request');
      socket?.emit('broadcast:getPendingMessages');
    }
  }

  function handleConfirmDiscard() {
    if (!messageIdToDiscard) return;

    // When discarding, remove entire batch if this message belongs to a batch
    const message = pendingMessages.find((m) => m.id === messageIdToDiscard);
    const metadata = (message?.metadata || {}) as Record<string, unknown>;
    const batchId = typeof metadata.batchId === 'string' ? metadata.batchId : null;

    if (batchId) {
      const batchMessages = pendingMessages.filter((m) => {
        const meta = (m.metadata || {}) as Record<string, unknown>;
        return meta.batchId === batchId;
      });

      // Optimistically remove all batch messages and call dismiss for each
      setPendingMessages((prev) =>
        prev.filter((m) => {
          const meta = (m.metadata || {}) as Record<string, unknown>;
          return meta.batchId !== batchId;
        })
      );
      setMessageIdToDiscard(null);

      Promise.all(batchMessages.map((m) => broadcastMessageService.dismissMessage(m.id))).catch(
        () => {
          // If anything fails, reload from server for consistency
          socket?.emit('broadcast:getPendingMessages');
        }
      );
      return;
    }

    handleDismiss(messageIdToDiscard);
  }

  const visiblePendingMessages = useMemo(
    () => pendingMessages.filter((m) => isBroadcastPendingStillActive(m)),
    [pendingMessages]
  );

  useEffect(() => {
    if (user?.role !== 'ASTROLOGER') {
      onHasItemsChange?.(false);
      return;
    }
    onHasItemsChange?.(visiblePendingMessages.length > 0);
  }, [user?.role, visiblePendingMessages.length, onHasItemsChange]);

  type MessageGroup = {
    key: string;
    messages: BroadcastMessage[];
  };

  const groups: MessageGroup[] = useMemo(() => {
    const groupsMap = new Map<string, BroadcastMessage[]>();
    for (const message of visiblePendingMessages) {
      const metadata = (message.metadata || {}) as Record<string, unknown>;
      const batchId = typeof metadata.batchId === 'string' ? metadata.batchId : null;
      const key = batchId || message.id;
      const existing = groupsMap.get(key) || [];
      groupsMap.set(key, [...existing, message]);
    }
    return Array.from(groupsMap.entries()).map(([key, messages]) => ({
      key,
      messages: messages.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    }));
  }, [visiblePendingMessages]);

  const sortedGroups = useMemo(() => sortBroadcastGroupsNewestFirst(groups), [groups]);

  useEffect(() => {
    if (sortedGroups.length === 0) return;
    const firstKey = sortedGroups[0].key;
    if (activeGroupKey == null || !sortedGroups.some((g) => g.key === activeGroupKey)) {
      setActiveGroupKey(firstKey);
    }
  }, [sortedGroups, activeGroupKey]);

  useEffect(() => {
    setDetailExpired(false);
  }, [activeGroupKey]);

  if (user?.role !== 'ASTROLOGER' || visiblePendingMessages.length === 0) {
    return null;
  }

  const currentGroup = sortedGroups.find((g) => g.key === activeGroupKey) ?? sortedGroups[0];
  const currentMessage = currentGroup.messages[0];
  const questionCount = currentGroup.messages.length;
  const totalRequests = sortedGroups.length;
  const batchTotalNr = getBatchTotalNr(currentGroup.messages);
  const maxNrAll = Math.max(0, ...sortedGroups.map((g) => getBatchTotalNr(g.messages)));
  const priceHighlightClass = getPriceTierClass(batchTotalNr, maxNrAll);
  const { freeOrOffer, paid: paidMessages } = splitBroadcastMessagesByPayment(currentGroup.messages);
  const onlyPaid = paidMessages.length > 0 && freeOrOffer.length === 0;
  const hasBoth = freeOrOffer.length > 0 && paidMessages.length > 0;

  const firstBroadcastIncluded = freeOrOffer.filter((m) => isFirstBroadcastDiscountQuestion(m));
  const otherFree = freeOrOffer.filter((m) => !isFirstBroadcastDiscountQuestion(m));

  const otherFreeLabel =
    otherFree.length > 1 ? 'Questions' : 'Question';
  const otherFreeSectionLabel =
    hasBoth && firstBroadcastIncluded.length > 0 && otherFree.length > 0
      ? 'Included free question(s)'
      : otherFreeLabel;

  let paidSectionLabel: string;
  if (onlyPaid) {
    paidSectionLabel = questionCount > 1 ? 'Paid questions' : 'Question';
  } else {
    paidSectionLabel = 'Paid questions';
  }

  const renderQuestionBlock = (
    items: BroadcastMessage[],
    label: string,
    variant: 'firstBroadcast' | 'free' | 'paid'
  ) => {
    const isPaid = variant === 'paid';
    const isFirstBroadcast = variant === 'firstBroadcast';
    const boxClass = isPaid
      ? 'max-h-52 overflow-y-auto rounded-xl border-2 border-emerald-500/55 bg-emerald-100 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:border-emerald-500/45 dark:bg-emerald-950/80 dark:shadow-none'
      : isFirstBroadcast
        ? 'max-h-40 overflow-y-auto rounded-xl border-2 border-amber-400/85 bg-gradient-to-b from-amber-50/95 to-amber-50/40 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_0_0_1px_rgba(251,191,36,0.2)] dark:border-amber-500/60 dark:from-amber-950/50 dark:to-amber-950/30'
        : 'max-h-40 overflow-y-auto rounded-xl border border-slate-200/90 bg-slate-50/90 p-3 shadow-sm dark:border-slate-600/60 dark:bg-slate-900/40';

    const labelClass = isPaid
      ? 'text-emerald-800 dark:text-emerald-300'
      : isFirstBroadcast
        ? 'text-amber-800 dark:text-amber-200'
        : 'text-slate-500';

    return (
      <div className="space-y-2">
        <p className={`text-[10px] font-bold uppercase tracking-[0.12em] ${labelClass}`}>
          {label}
        </p>
        <div data-no-drag className={boxClass}>
          <ul className="space-y-4 text-sm text-slate-900 dark:text-slate-100">
            {items.map((msg, index) => {
              const amt = getMessageAmountNr(msg);
              const innerRow = isPaid
                ? 'border-emerald-400/60 bg-emerald-50/90 dark:border-emerald-600/50 dark:bg-emerald-900/40'
                : isFirstBroadcast
                  ? 'border-amber-300/90 bg-white/80 dark:border-amber-700/50 dark:bg-amber-950/20'
                  : 'border-slate-200 bg-white/90 dark:border-slate-600/50 dark:bg-slate-800/30';
              const qTitle = isPaid
                ? 'font-bold text-emerald-900 dark:text-emerald-200'
                : isFirstBroadcast
                  ? 'font-bold text-amber-900 dark:text-amber-100'
                  : 'font-bold text-slate-800 dark:text-slate-100';
              return (
                <li key={msg.id} className={`rounded-lg border p-3 leading-relaxed ${innerRow}`}>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={qTitle}>Q{index + 1}</span>
                    {amt === 0 ? (
                      <span
                        className={
                          isFirstBroadcast
                            ? 'rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950 dark:bg-amber-900/60 dark:text-amber-100'
                            : 'rounded-md bg-slate-200/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700 dark:bg-slate-700/80 dark:text-slate-200'
                        }
                      >
                        Free
                      </span>
                    ) : (
                      <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm dark:bg-emerald-500">
                        Paid
                      </span>
                    )}
                  </div>
                  <p className="text-[15px] leading-relaxed text-slate-800 dark:text-slate-100">
                    {msg.content}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  };

  const detailPanel = (
    <div
      className={`flex min-w-0 flex-col rounded-2xl border border-emerald-200/50 bg-gradient-to-b from-white to-slate-50/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-emerald-900/40 dark:from-slate-900 dark:to-slate-950/90 ${priceHighlightClass}`}
    >
      <div className="mb-4 flex items-start gap-3">
        <Avatar className="h-14 w-14 shrink-0 ring-2 ring-amber-200 ring-offset-2 dark:ring-amber-700/50 dark:ring-offset-slate-900">
          <AvatarImage
            src={getImageUrl(currentMessage.client?.profilePhoto) || undefined}
            alt={currentMessage.client?.name || 'Client'}
          />
          <AvatarFallback className="bg-gradient-to-br from-amber-600 to-orange-700 text-xl font-bold text-white">
            {!currentMessage.client?.profilePhoto && !currentMessage.client?.name ? (
              <User className="h-7 w-7 text-white" />
            ) : (
              (currentMessage.client?.name || currentMessage.client?.phone || 'C')
                .charAt(0)
                .toUpperCase()
            )}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-xl font-bold leading-tight text-gray-900 dark:text-white">
            {currentMessage.client?.name || currentMessage.client?.phone || 'Client'}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Time remaining
            </p>
            <CountdownTimer
              key={currentMessage.id}
              createdAt={currentMessage.createdAt}
              expiresAt={currentMessage.expiresAt}
              expiryMs={BROADCAST_MESSAGE_EXPIRY_MS}
              showIcon
              className="text-base font-bold tabular-nums"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {formatDistanceToNowStrict(new Date(currentMessage.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Price</p>
          <span
            className={cn(
              'mt-1 inline-flex rounded-lg px-3 py-1.5 text-sm font-bold uppercase tracking-wide',
              batchTotalNr > 0
                ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500'
                : 'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-white'
            )}
          >
            {batchTotalNr > 0 ? 'Paid' : 'Free'}
          </span>
        </div>
      </div>

      <div className="mb-4 space-y-5">
        {firstBroadcastIncluded.length > 0 &&
          renderQuestionBlock(
            firstBroadcastIncluded,
            'First broadcast (offer)',
            'firstBroadcast'
          )}
        {otherFree.length > 0 &&
          renderQuestionBlock(otherFree, otherFreeSectionLabel, 'free')}
        {paidMessages.length > 0 && renderQuestionBlock(paidMessages, paidSectionLabel, 'paid')}
      </div>

      <div className="mb-4" data-no-drag>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Time left
        </p>
        <ProgressBar
          key={currentMessage.id}
          createdAt={currentMessage.createdAt}
          expiresAt={currentMessage.expiresAt}
          expiryMs={BROADCAST_MESSAGE_EXPIRY_MS}
          variant="prominent"
          onExpire={() => {
            setDetailExpired(true);
            socket?.emit('broadcast:getPendingMessages');
          }}
        />
      </div>

      <div className="flex gap-3 pt-1" data-no-drag>
        <LoadingButton
          isLoading={accepting === currentMessage.id}
          disabled={accepting === currentMessage.id || detailExpired}
          onClick={() => handleAccept(currentMessage.id)}
          className="flex h-12 min-h-12 flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-fuchsia-600 px-4 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:brightness-110 hover:shadow-xl"
        >
          <MessageSquare className="mr-2 h-4 w-4 shrink-0" />
          Accept
        </LoadingButton>
        <button
          type="button"
          onClick={() => {
            setDetailOpen(false);
            setMessageIdToDiscard(currentMessage.id);
          }}
          disabled={accepting === currentMessage.id || detailExpired}
          className="flex h-12 min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          Reject
        </button>
      </div>
    </div>
  );

  const floatingDetail =
    mounted && typeof document !== 'undefined' && detailOpen && totalRequests > 0
      ? createPortal(
          <div
            className="pointer-events-auto fixed bottom-6 right-6 z-[10050] w-[min(96vw,440px)] cursor-grab animate-in fade-in zoom-in-95 duration-200 active:cursor-grabbing"
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
            }}
            onMouseDown={handleDragMouseDown}
          >
            <Card className="overflow-hidden rounded-xl border-2 border-slate-300/90 bg-white shadow-2xl ring-1 ring-slate-400/25 dark:border-slate-600 dark:bg-slate-950 dark:ring-slate-500/30">
              {!isMinimized && (
                <div className="border-b border-slate-800 bg-slate-900 px-4 py-3 dark:bg-slate-950">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 select-none">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-400">
                        Request detail
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMinimized((m) => {
                            const next = !m;
                            if (next) setPosition({ x: 0, y: 0 });
                            return next;
                          });
                        }}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Minimize"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailOpen(false)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Close"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isMinimized ? (
                <div className="flex items-center gap-2 bg-gradient-to-r from-slate-50 to-slate-100/95 px-3 py-2.5 dark:from-slate-900 dark:to-slate-950">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMinimized(false);
                      setPosition({ x: 0, y: 0 });
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                    <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {currentMessage.client?.name || currentMessage.client?.phone || 'Client'} —{' '}
                      <span className="font-bold uppercase text-teal-700 dark:text-teal-300">
                        {batchTotalNr > 0 ? 'Paid' : 'Free'}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMinimized(false);
                      setPosition({ x: 0, y: 0 });
                    }}
                    className="shrink-0 rounded-lg p-2 text-teal-700 hover:bg-white/60 dark:text-teal-300 dark:hover:bg-white/10"
                    aria-label="Expand"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailOpen(false)}
                    className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-white/60 dark:hover:bg-white/10"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="max-h-[min(78vh,560px)] overflow-y-auto p-4">{detailPanel}</div>
              )}
            </Card>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <SidebarRequestList
        stacked
        hideHeader
        className="min-w-0"
        groups={sortedGroups}
        activeKey={activeGroupKey ?? sortedGroups[0]?.key ?? ''}
        acceptingMessageId={accepting}
        onSelectGroup={(key) => {
          setActiveGroupKey(key);
          setDetailOpen(true);
          setIsMinimized(false);
        }}
        onAccept={(id) => handleAccept(id)}
        onReject={(id) => setMessageIdToDiscard(id)}
      />

      {floatingDetail}

      <ConfirmDialog
        isOpen={messageIdToDiscard !== null}
        onClose={() => setMessageIdToDiscard(null)}
        onConfirm={handleConfirmDiscard}
        title="Discard this request?"
        description="Are you sure you want to discard this request? The client will need to send a new request to connect with an astrologer."
        confirmText="Yes, discard"
        cancelText="Cancel"
        isDestructive
        overlayClassName="z-[10060]"
      />

      {!isConnected && (
        <div className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-600 dark:border-amber-800 dark:bg-amber-950/40">
          <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-amber-600" />
          <span className="font-medium">Reconnecting…</span>
        </div>
      )}
    </>
  );
}
