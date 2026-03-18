/**
 * Astrologer Broadcast View ("Channel Jyotish" view for astrologers)
 * Shows all broadcast messages from clients with their status
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, Avatar, AvatarImage, AvatarFallback } from '@jyotish/ui';
import { LoadingButton } from '@/components/ui';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/auth-store';
import type { BroadcastMessage } from '@/types';
import { BroadcastMessageStatus } from '@/types';
import broadcastMessageService from '@/services/broadcastMessage.service';
import chatService from '@/services/chat.service';
import { toast } from 'sonner';
import { MessageSquare, Clock, CheckCircle2, Send, Lock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getImageUrl } from '@/utils/image.utils';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { BROADCAST_MESSAGE_EXPIRY_MS } from '@/constants/broadcastMessage.constants';
import { ROUTE_BUILDERS } from '@/constants';
import { useRouter } from 'next/navigation';
import type { User as SharedUser } from '@jyotish/shared';

interface AstrologerBroadcastViewProps {
  onChatCreated?: (chatId: string) => void;
}

export function AstrologerBroadcastView({ onChatCreated }: AstrologerBroadcastViewProps) {
  const { socket, isConnected } = useSocket();
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  // ✅ REMOVED: hasActiveChat state - astrologers can handle multiple chats
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isInhouseAstrologer = (currentUser: SharedUser | null | undefined): boolean => {
    if (!currentUser || currentUser.role !== 'ASTROLOGER') {
      return false;
    }
    return currentUser.astrologer?.inhouseAstrologer === true;
  };

  const isMultiQuestionNonFirst = (message: BroadcastMessage): boolean => {
    const metadata = (message.metadata ?? {}) as {
      batchId?: string;
      batchIndex?: number;
      totalInBatch?: number;
    };
    if (!metadata.batchId || typeof metadata.totalInBatch !== 'number') {
      return false;
    }
    if (metadata.totalInBatch <= 1) {
      return false;
    }
    return typeof metadata.batchIndex === 'number' && metadata.batchIndex > 0;
  };

  // Load all broadcast messages on mount
  useEffect(() => {
    if (user?.role === 'ASTROLOGER') {
      loadMessages();
    }
  }, [user]);

  // ✅ REMOVED: checkActiveChat function - no longer needed

  // Setup socket listeners
  useEffect(() => {
    if (!socket || !isConnected || user?.role !== 'ASTROLOGER') return;

    // New broadcast message received — toast is shown in BroadcastMessageBar (with batch dedup)
    socket.on('broadcast:newMessage', (message: BroadcastMessage) => {
      setMessages((prev) => {
        // Check if message already exists
        if (prev.find((m) => m.id === message.id)) {
          return prev;
        }
        return [message, ...prev];
      });
    });

    // Message was accepted by an astrologer - remove immediately from list
    socket.on(
      'broadcast:messageAcceptedByAstrologer',
      (data: {
        messageId: string;
        acceptedBy: { id: string; name?: string };
        acceptedAt: string;
        clientName: string;
      }) => {
        // If accepted by current user, show success toast but still remove from list
        // (they'll be navigated to chat anyway)
        if (data.acceptedBy.id === user?.id) {
          toast.success('Chat started successfully!');
        } else {
          // If accepted by another astrologer, remove immediately
          toast.info('This request was accepted by another astrologer');
        }

        // Remove message immediately - it's no longer available
        setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
      }
    );

    // My acceptance was successful - remove from list immediately
    socket.on(
      'broadcast:messageAccepted',
      (result: { message?: { id: string }; chat?: { id: string } }) => {
        setAccepting(null);

        // Remove message immediately - it's been accepted and chat is opening
        if (result.message?.id) {
          setMessages((prev) => prev.filter((m) => m.id !== result.message!.id));
        }

        // Navigate to chat immediately
        if (result.chat) {
          toast.success('Chat opened! Redirecting...', { duration: 1500 });

          // Navigate to the chat page
          router.push(ROUTE_BUILDERS.JYOTISH_CHAT_WITH_ID(result.chat.id));

          // Also notify parent callback if provided
          if (onChatCreated) {
            onChatCreated(result.chat.id);
          }
        }
      }
    );

    // Client cancelled their broadcast – remove from list
    socket.on('broadcast:messageCancelled', (data: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    });

    socket.on('broadcast:error', (error: { message?: string }) => {
      toast.error(error.message || 'Something went wrong');
      setAccepting(null);
    });

    return () => {
      socket.off('broadcast:newMessage');
      socket.off('broadcast:messageAcceptedByAstrologer');
      socket.off('broadcast:messageAccepted');
      socket.off('broadcast:messageCancelled');
      socket.off('broadcast:error');
    };
  }, [socket, isConnected, user, onChatCreated, router]);

  async function loadMessages() {
    try {
      setLoading(true);
      const allMessages = await broadcastMessageService.getAllMessages();
      setMessages(allMessages || []);
    } catch (error) {
      console.error('Error loading all broadcast messages:', error);
      // Don't show error toast - table might not exist yet
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(messageId: string) {
    if (!socket || !isConnected) {
      toast.error('Not connected to server');
      return;
    }

    // ✅ REMOVED: Astrologers can now accept multiple chats at once
    // No need to check for active chat

    // Check if already accepted
    const message = messages.find((m) => m.id === messageId);
    if (message?.status === BroadcastMessageStatus.ACCEPTED) {
      toast.error('This message has already been accepted');
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

  function getStatusBadge(message: BroadcastMessage) {
    if (message.status === BroadcastMessageStatus.ACCEPTED && message.acceptedAstrologer) {
      const isMe = message.acceptedAstrologer.id === user?.id;
      return (
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            isMe ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>
            {isMe
              ? 'Accepted by you'
              : `Accepted by ${message.acceptedAstrologer.name || message.acceptedAstrologer.phone}`}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
        <MessageSquare className="h-3.5 w-3.5" />
        <span>Pending</span>
      </div>
    );
  }

  if (user?.role !== 'ASTROLOGER') {
    return null;
  }

  // Filter messages - only show PENDING messages (remove expired, cancelled, and accepted)
  // ✅ Astrologers should only see pending requests they can act on
  const inhouse = isInhouseAstrologer(user as unknown as SharedUser | null);
  const visibleMessages = messages.filter((m) => {
    if (m.status !== BroadcastMessageStatus.PENDING) {
      return false;
    }
    if (inhouse) {
      return true;
    }
    return isMultiQuestionNonFirst(m);
  });

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Channel Jyotish (All Clients)</h2>
            <p className="text-sm text-gray-600">
              {messages.filter((m) => m.status === 'PENDING').length} pending requests
            </p>
          </div>
          {/* ✅ REMOVED: Active chat warning - astrologers can handle multiple chats */}
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="p-4 bg-purple-100 rounded-full mb-4">
              <MessageSquare className="h-12 w-12 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Broadcast Messages</h3>
            <p className="text-gray-600 max-w-md">
              When clients send broadcast messages, they will appear here for you to accept.
            </p>
          </div>
        ) : (
          visibleMessages.map((message) => (
            <Card
              key={message.id}
              className={`p-5 transition-all duration-200 hover:shadow-lg ${
                message.status === BroadcastMessageStatus.ACCEPTED
                  ? 'bg-white opacity-75'
                  : 'bg-white border-2 border-purple-200'
              }`}
            >
              {/* Client Info & Status */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-purple-100">
                    <AvatarImage
                      src={getImageUrl(message.client?.profilePhoto) || undefined}
                      alt={message.client?.name || 'Client'}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold">
                      {!message.client?.profilePhoto && !message.client?.name ? (
                        <User className="h-6 w-6 text-white" />
                      ) : (
                        (message.client?.name || message.client?.phone || 'C')
                          .charAt(0)
                          .toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-lg">
                      {message.client?.name || message.client?.phone}
                    </p>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(message)}
                  {message.status === 'PENDING' && (
                    <CountdownTimer
                      createdAt={message.createdAt}
                      expiryMs={BROADCAST_MESSAGE_EXPIRY_MS}
                      showIcon={true}
                      onExpire={() => {
                        // Remove expired message immediately from list
                        setMessages((prev) => prev.filter((m) => m.id !== message.id));
                        toast.info('This request has expired');
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 mb-4">
                <p className="text-gray-800 leading-relaxed">{message.content}</p>
              </div>

              {/* Action Button */}
              {message.status === 'PENDING' && (
                <LoadingButton
                  isLoading={accepting === message.id}
                  disabled={accepting === message.id || !isConnected}
                  onClick={() => handleAccept(message.id)}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Accept & Start Chat
                </LoadingButton>
              )}

              {message.status === BroadcastMessageStatus.ACCEPTED &&
                message.acceptedAstrologer?.id === user?.id && (
                  <button
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                    disabled
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2 inline" />
                    You&apos;re chatting with this client
                  </button>
                )}
            </Card>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="flex-shrink-0 bg-yellow-50 border-t border-yellow-200 px-6 py-3">
          <p className="text-sm text-yellow-800 text-center">Reconnecting to server...</p>
        </div>
      )}
    </div>
  );
}
