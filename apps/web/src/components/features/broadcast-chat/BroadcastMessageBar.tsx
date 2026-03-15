/**
 * Broadcast Message Bar (for Astrologers)
 * Displays broadcast messages from clients as popup notifications
 * Similar to InstantChatRequestBar
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, Avatar, AvatarImage, AvatarFallback } from '@jyotish/ui';
import { LoadingButton } from '@/components/ui';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/auth-store';
import type { BroadcastMessage } from '@/types';
import broadcastMessageService from '@/services/broadcastMessage.service';
import { toast } from 'sonner';
import {
  MessageSquare,
  X,
  Clock,
  User,
  Minus,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getImageUrl } from '@/utils/image.utils';
import { useRouter } from 'next/navigation';
import { ROUTE_BUILDERS } from '@/constants';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { BROADCAST_MESSAGE_EXPIRY_MS } from '@/constants/broadcastMessage.constants';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function BroadcastMessageBar() {
  const { socket, isConnected } = useSocket();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const [pendingMessages, setPendingMessages] = useState<BroadcastMessage[]>([]);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [messageIdToDiscard, setMessageIdToDiscard] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  // Simple draggable state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null);
  const dragFrameRef = useRef<number | null>(null);
  const pendingDeltaRef = useRef<{ dx: number; dy: number } | null>(null);

  function handleDragMouseDown(event: React.MouseEvent) {
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
        const cardWidth = 420;
        const margin = 16;

        const minX = -(viewportWidth - cardWidth - margin);
        const maxX = 0;

        const headerHeight = 120; // ensure header area always visible
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

  // Load pending broadcast messages on mount
  useEffect(() => {
    if (user?.role === 'ASTROLOGER') {
      loadPendingMessages();
    }
  }, [user]);

  // Setup socket listeners
  useEffect(() => {
    if (!socket || !isConnected || user?.role !== 'ASTROLOGER') return;

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

    // Message was accepted by an astrologer - remove immediately
    socket.on(
      'broadcast:messageAcceptedByAstrologer',
      (data: {
        messageId: string;
        acceptedBy: { id: string; name?: string };
        acceptedAt: string;
        clientName: string;
      }) => {
        // Remove message immediately - it's no longer available
        setPendingMessages((prev) => prev.filter((m) => m.id !== data.messageId));
        if (data.acceptedBy.id !== user?.id) {
          toast.info('This request was accepted by another astrologer');
        }
      }
    );

    // Client cancelled their broadcast - remove immediately
    socket.on('broadcast:messageCancelled', (data: { messageId: string }) => {
      setPendingMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    });

    // My acceptance was successful - remove immediately
    socket.on(
      'broadcast:messageAccepted',
      (data: { message?: { id: string }; chat?: { id: string } }) => {
        if (data.message?.id) {
          setPendingMessages((prev) => prev.filter((m) => m.id !== data.message!.id));
        }
        setAccepting(null);
        if (data.chat) {
          toast.success('Chat started successfully!');
          router.push(ROUTE_BUILDERS.JYOTISH_CHAT_WITH_ID(data.chat.id));
        }
      }
    );

    socket.on('broadcast:error', (error: { message?: string }) => {
      toast.error(error.message || 'Something went wrong');
      setAccepting(null);
    });

    return () => {
      socket.off('broadcast:newMessage');
      socket.off('broadcast:messageAcceptedByAstrologer');
      socket.off('broadcast:messageCancelled');
      socket.off('broadcast:messageAccepted');
      socket.off('broadcast:error');
    };
  }, [socket, isConnected, user, router]);

  async function loadPendingMessages() {
    try {
      const messages = await broadcastMessageService.getPendingMessages();
      setPendingMessages(messages || []); // Ensure we always have an array
    } catch (error) {
      console.error('Error loading pending broadcast messages:', error);
      // Don't show error toast - table might not exist yet
      setPendingMessages([]);
    }
  }

  async function handleAccept(messageId: string) {
    if (!socket || !isConnected) {
      toast.error('Not connected to server');
      return;
    }

    try {
      setAccepting(messageId);

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
      loadPendingMessages();
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
          loadPendingMessages();
        }
      );
      return;
    }

    handleDismiss(messageIdToDiscard);
  }

  function getTimeRemaining(createdAt: string | Date): string {
    const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    return `${diffMins} minutes ago`;
  }

  // Don't show if not an astrologer or no pending messages
  if (user?.role !== 'ASTROLOGER' || pendingMessages.length === 0) {
    return null;
  }

  // Group messages so multi-question broadcasts (batchId) appear as one request
  type MessageGroup = {
    key: string;
    messages: BroadcastMessage[];
  };

  const groupsMap = new Map<string, BroadcastMessage[]>();
  for (const message of pendingMessages) {
    const metadata = (message.metadata || {}) as Record<string, unknown>;
    const batchId = typeof metadata.batchId === 'string' ? metadata.batchId : null;
    const key = batchId || message.id;
    const existing = groupsMap.get(key) || [];
    groupsMap.set(key, [...existing, message]);
  }

  const groups: MessageGroup[] = Array.from(groupsMap.entries()).map(([key, messages]) => ({
    key,
    messages: messages.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ),
  }));

  // Ensure activeGroupIndex is always valid
  const safeActiveIndex = Math.min(activeGroupIndex, Math.max(groups.length - 1, 0));
  if (safeActiveIndex !== activeGroupIndex) {
    setActiveGroupIndex(safeActiveIndex);
  }

  const currentGroup = groups[safeActiveIndex];
  const currentMessage = currentGroup.messages[0];
  const questionCount = currentGroup.messages.length;
  const totalRequests = groups.length;

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-8 fade-in transition-transform cursor-move"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      onMouseDown={handleDragMouseDown}
    >
      <Card className="w-[420px] bg-white border-0 shadow-2xl ring-4 ring-purple-500/20 overflow-hidden pointer-events-auto">
        {/* Animated gradient header */}
        <div className="h-2 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 animate-gradient-x"></div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4 select-none">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg">
                <MessageSquare className="h-6 w-6 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-gray-900 font-bold text-lg">
                  New Client Request
                  {questionCount > 1 && (
                    <span className="ml-2 text-xs font-semibold text-purple-600">
                      ({questionCount} questions)
                    </span>
                  )}
                </h3>
                {totalRequests > 1 && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-gray-600 font-medium">
                      {safeActiveIndex + 1} of {totalRequests} requests
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveGroupIndex((prev) => (prev <= 0 ? totalRequests - 1 : prev - 1));
                        }}
                      >
                        <ChevronLeft className="h-3 w-3 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveGroupIndex((prev) => (prev >= totalRequests - 1 ? 0 : prev + 1));
                        }}
                      >
                        <ChevronRight className="h-3 w-3 text-gray-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized((prev) => !prev);
                  if (!isMinimized && typeof window !== 'undefined') {
                    // When minimizing, reset position so next expand is fully visible
                    setPosition({ x: 0, y: 0 });
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                ) : (
                  <Minus className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                )}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMessageIdToDiscard(currentMessage.id);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                disabled={accepting === currentMessage.id}
              >
                <X className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
              </button>
            </div>
          </div>

          {isMinimized ? (
            <div
              className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-purple-50 border border-purple-100 cursor-pointer"
              onClick={() => {
                setIsMinimized(false);
                // Ensure header is always visible when expanding
                setPosition({ x: 0, y: 0 });
              }}
            >
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">New Client Requests</span>
                <span className="text-xs text-gray-600">
                  {totalRequests === 1
                    ? questionCount === 1
                      ? '1 question pending'
                      : `${questionCount} questions pending`
                    : `Request ${safeActiveIndex + 1} of ${totalRequests} (${questionCount} questions)`}
                </span>
              </div>
              {totalRequests > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-purple-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveGroupIndex((prev) => (prev <= 0 ? totalRequests - 1 : prev - 1));
                    }}
                  >
                    <ChevronLeft className="h-3 w-3 text-purple-700" />
                  </button>
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-purple-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveGroupIndex((prev) => (prev >= totalRequests - 1 ? 0 : prev + 1));
                    }}
                  >
                    <ChevronRight className="h-3 w-3 text-purple-700" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Client Info Card */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 mb-4 border border-purple-100">
                <div className="flex items-start gap-3">
                  <Avatar className="h-14 w-14 ring-2 ring-purple-200 ring-offset-2">
                    <AvatarImage
                      src={getImageUrl(currentMessage.client?.profilePhoto) || undefined}
                      alt={currentMessage.client?.name || 'Client'}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold text-xl">
                      {!currentMessage.client?.profilePhoto && !currentMessage.client?.name ? (
                        <User className="h-7 w-7 text-white" />
                      ) : (
                        (currentMessage.client?.name || currentMessage.client?.phone || 'C')
                          .charAt(0)
                          .toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-gray-900 font-bold text-lg mb-1">
                      {currentMessage.client?.name || currentMessage.client?.phone}
                    </p>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Clock className="h-4 w-4" />
                      <CountdownTimer
                        createdAt={currentMessage.createdAt}
                        expiryMs={BROADCAST_MESSAGE_EXPIRY_MS}
                        showIcon={false}
                        onExpire={() => {
                          // Remove expired message immediately
                          setPendingMessages((prev) =>
                            prev.filter((m) => m.id !== currentMessage.id)
                          );
                          toast.info('This request has expired');
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Message Content */}
                <div className="mt-4 bg-white rounded-lg p-4 shadow-sm border border-purple-100 max-h-60 overflow-y-auto">
                  {questionCount > 1 ? (
                    <ul className="space-y-2 text-sm text-gray-700">
                      {currentGroup.messages.map((msg, index) => (
                        <li
                          key={msg.id}
                          className="flex items-start gap-2 rounded-md bg-purple-50 px-3 py-2 border border-purple-100"
                        >
                          <span className="mt-[2px] flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-[11px] font-semibold text-purple-700">
                            {index + 1}
                          </span>
                          <p className="leading-relaxed">{msg.content}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                      {currentMessage.content}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <LoadingButton
                  isLoading={accepting === currentMessage.id}
                  disabled={accepting === currentMessage.id}
                  onClick={() => handleAccept(currentMessage.id)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Accept & Chat
                </LoadingButton>
                <button
                  type="button"
                  onClick={() => setMessageIdToDiscard(currentMessage.id)}
                  disabled={accepting === currentMessage.id}
                  className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
                >
                  Later
                </button>
              </div>
            </>
          )}

          <ConfirmDialog
            isOpen={messageIdToDiscard !== null}
            onClose={() => setMessageIdToDiscard(null)}
            onConfirm={handleConfirmDiscard}
            title="Discard this request?"
            description="Are you sure you want to discard this request? The client will need to send a new request to connect with an astrologer."
            confirmText="Yes, discard"
            cancelText="Cancel"
            isDestructive
          />

          {/* Connection Status */}
          {!isConnected && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg py-2 px-3 border border-amber-200">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-600"></div>
              <span className="font-medium">Reconnecting...</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
