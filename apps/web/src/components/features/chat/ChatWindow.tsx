/**
 * ChatWindow Component
 * Main chat interface showing messages and input
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Avatar, AvatarImage, AvatarFallback, Button, Textarea, Label, Input } from '@jyotish/ui';
import {
  ArrowLeft,
  MoreVertical,
  PhoneOff,
  MessageCircle,
  MessageSquare,
  Clock,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { Tooltip } from '@/components/ui/Tooltip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingButton } from '@/components/ui';
import { getImageUrl } from '@/utils/image.utils';
import { UserRole } from '@/types';
import { useStore } from '@/store';
import { endChat as endChatService, getOrCreateChat } from '@/services/chat.service';
import { toast } from 'sonner';
import { Chat, Message } from '@/types/chat';
import { useAuthStore } from '@/store/auth-store';
import { useSocket } from '@/hooks/useSocket';
import { useMutation } from '@tanstack/react-query';
import complaintService from '@/services/complaint.service';
import { ComplaintCategory, COMPLAINT_CATEGORY_LABELS } from '@/types/complaint';
import { InlineChatRating } from '@/components/features/ratings';

interface SystemMessage {
  id: string;
  chatId?: string;
  content: string;
  type: 'SYSTEM';
  isSystemMessage: true;
  createdAt: string;
}

interface ChatWindowProps {
  chat: (Chat & { status?: 'ACTIVE' | 'ENDED'; isLocked?: boolean }) | null;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
  onInputFocus?: () => void;
  onLoadMore?: () => void;
  onBack?: () => void;
  onChatEnded?: () => void;
  isTyping?: boolean;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  isConnected?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  chat,
  messages,
  currentUserId,
  onSendMessage,
  onTyping,
  onInputFocus,
  onLoadMore,
  onBack,
  onChatEnded,
  isTyping = false,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  isConnected = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isEndingChat, setIsEndingChat] = useState(false);
  const [showEndChatConfirm, setShowEndChatConfirm] = useState(false);
  const [isReopeningChat, setIsReopeningChat] = useState(false);
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);
  const [waitingForReply, setWaitingForReply] = useState(false);
  const [lastClientMessageTime, setLastClientMessageTime] = useState<Date | null>(null);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintCategory, setComplaintCategory] = useState<ComplaintCategory>(
    ComplaintCategory.SLOW_RESPONSE
  );
  const [complaintAttachment, setComplaintAttachment] = useState<File | null>(null);
  const onlineUsers = useStore((state) => state.onlineUsers);
  const user = useAuthStore((state) => state.user);
  const { socket } = useSocket();
  const previousScrollHeight = useRef<number>(0);
  const isLoadingMoreRef = useRef(false);
  const previousChatId = useRef<string | null>(null);

  // Complaint submission mutation
  const submitComplaintMutation = useMutation({
    mutationFn: async () => {
      if (!chat?.astrologerParticipant?.id) {
        throw new Error('Astrologer information not available');
      }

      if (!complaintSubject.trim()) {
        throw new Error('Please provide a subject for your complaint');
      }

      if (!complaintDescription.trim()) {
        throw new Error('Please describe your complaint in detail');
      }

      return complaintService.createComplaint({
        astrologerId: chat.astrologerParticipant.id,
        chatId: chat.id,
        subject: complaintSubject,
        description: complaintDescription,
        category: complaintCategory,
        attachment: complaintAttachment,
      });
    },
    onSuccess: () => {
      toast.success('Complaint submitted successfully! Our team will review it shortly.');
      // Reset form
      setComplaintSubject('');
      setComplaintDescription('');
      setComplaintCategory(ComplaintCategory.SLOW_RESPONSE);
      setComplaintAttachment(null);
      setShowComplaintForm(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit complaint. Please try again.');
    },
  });

  const handleSubmitComplaint = () => {
    if (!complaintSubject.trim()) {
      toast.error('Please provide a subject for your complaint');
      return;
    }
    if (!complaintDescription.trim()) {
      toast.error('Please describe your complaint in detail');
      return;
    }
    submitComplaintMutation.mutate();
  };

  // Wrapper for onSendMessage to handle turn-based logic
  const handleSendMessage = (content: string) => {
    // If client is sending a message and turn-based is enabled, set waiting state immediately
    if (user?.role === UserRole.CLIENT && chat?.turnBasedEnabled !== false) {
      console.log('💬 [ChatWindow] Client sending message, setting waiting state');
      setWaitingForReply(true);
      setLastClientMessageTime(new Date());
    }

    // Call the parent's onSendMessage
    onSendMessage(content);
  };

  // Initialize turn state from chat prop
  useEffect(() => {
    if (chat && chat.turnBasedEnabled !== false) {
      setWaitingForReply(chat.waitingForReply || false);
      if (chat.lastClientMessageAt) {
        setLastClientMessageTime(new Date(chat.lastClientMessageAt));
      }
    } else {
      setWaitingForReply(false);
      setLastClientMessageTime(null);
    }
  }, [chat]);

  // Listen for socket events for turn-based messaging
  useEffect(() => {
    if (!socket || !chat) return;

    // Listen for system messages (like waiting notifications)
    const handleSystemMessage = (message: SystemMessage) => {
      if (message.chatId && message.chatId !== chat.id) return;

      setSystemMessages((prev) => [...prev, message]);

      // Auto-scroll to show system message
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    };

    // Listen for sent messages to update turn state
    const handleMessageSent = (data: any) => {
      if (data.chatId !== chat.id) return;

      console.log('📤 [ChatWindow] Message sent event:', data);

      if (user?.role === UserRole.CLIENT && data.turnState) {
        console.log('🔄 [ChatWindow] Updating client turn state:', data.turnState);
        setWaitingForReply(data.turnState.waitingForReply);
        if (data.turnState.lastClientMessageAt) {
          setLastClientMessageTime(new Date(data.turnState.lastClientMessageAt));
        }
      }
    };

    // Listen for received messages to update turn state
    const handleMessageReceived = (data: any) => {
      if (data.chatId !== chat.id) return;

      console.log('📥 [ChatWindow] Message received event:', data);

      // If client receives a message, they can reply now (no longer waiting)
      if (user?.role === UserRole.CLIENT) {
        if (data.turnState) {
          console.log('🔄 [ChatWindow] Updating client turn state from received:', data.turnState);
          setWaitingForReply(data.turnState.waitingForReply);
        } else {
          // If no turn state in message, assume client can now reply
          console.log('✅ [ChatWindow] Client received message, can now reply');
          setWaitingForReply(false);
        }
      }
    };

    // Listen for new messages from the astrologer
    const handleNewMessage = (message: any) => {
      if (message.chatId !== chat.id) return;

      console.log('📨 [ChatWindow] New message event:', message);

      // If client receives a message from astrologer, clear waiting state
      if (user?.role === UserRole.CLIENT && message.senderId !== user.id) {
        console.log('✅ [ChatWindow] Astrologer replied, clearing waiting state');
        setWaitingForReply(false);
      }
    };

    socket.on('chat:system_message', handleSystemMessage);
    socket.on('chat:sent', handleMessageSent);
    socket.on('chat:receive', handleMessageReceived);
    socket.on('chat:newMessage', handleNewMessage);

    return () => {
      socket.off('chat:system_message', handleSystemMessage);
      socket.off('chat:sent', handleMessageSent);
      socket.off('chat:receive', handleMessageReceived);
      socket.off('chat:newMessage', handleNewMessage);
    };
  }, [socket, chat, user]);

  // Deduplicate messages to prevent React key warnings and merge with system messages
  const uniqueMessages = useMemo(() => {
    const seen = new Set<string>();
    const filtered = messages.filter((message) => {
      if (seen.has(message.id)) {
        console.warn('⚠️ Duplicate message detected and removed:', message.id);
        return false;
      }
      seen.add(message.id);
      return true;
    });

    // Merge system messages
    const allMessages = [...filtered, ...systemMessages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return allMessages;
  }, [messages, systemMessages]);

  // Force scroll to bottom when switching to a new chat
  useEffect(() => {
    const currentChatId = chat?.id || null;

    // Only trigger on actual chat change (not initial mount with null)
    if (currentChatId !== previousChatId.current && currentChatId !== null) {
      console.log('📍 New chat selected, scrolling to bottom...');

      // Reset auto-scroll to true for new conversation
      setAutoScroll(true);

      // Force immediate scroll to bottom
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
        }
      }, 100);
    }

    previousChatId.current = currentChatId;
  }, [chat?.id]);

  // Auto-scroll to bottom when new messages arrive (only if user is at bottom)
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [uniqueMessages, autoScroll]);

  // Preserve scroll position when loading more messages
  useEffect(() => {
    if (isLoadingMoreRef.current && messagesContainerRef.current) {
      const currentScrollHeight = messagesContainerRef.current.scrollHeight;
      const scrollDiff = currentScrollHeight - previousScrollHeight.current;
      messagesContainerRef.current.scrollTop += scrollDiff;
      isLoadingMoreRef.current = false;
    }
  }, [uniqueMessages]);

  // Detect scroll position and trigger load more
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    const isAtTop = scrollTop < 100;

    setAutoScroll(isAtBottom);

    // Load more messages when scrolling near the top
    if (isAtTop && hasMore && !isLoadingMore && onLoadMore) {
      console.log('📜 Loading more messages...');
      previousScrollHeight.current = scrollHeight;
      isLoadingMoreRef.current = true;
      onLoadMore();
    }
  };

  // Handle showing end chat confirmation
  const handleEndChat = () => {
    setShowEndChatConfirm(true);
  };

  // Handle actual chat ending after confirmation
  const handleConfirmEndChat = async () => {
    if (!chat || isEndingChat) return;

    setIsEndingChat(true);
    try {
      await endChatService(chat.id);
      setShowEndChatConfirm(false);
      toast.success('Chat ended successfully');

      if (onChatEnded) {
        onChatEnded();
      }
    } catch (error: any) {
      console.error('Error ending chat:', error);
      toast.error(error.message || 'Failed to end chat');
    } finally {
      setIsEndingChat(false);
    }
  };

  // Handle reopening locked chat (only for clients)
  const handleReopenChat = async () => {
    if (!chat || !user || isReopeningChat) return;

    // Determine the other user ID
    const otherUserId =
      chat.clientParticipant.id === currentUserId
        ? chat.astrologerParticipant.id
        : chat.clientParticipant.id;

    setIsReopeningChat(true);
    try {
      // Call getOrCreateChat - this will unlock the locked chat
      await getOrCreateChat({ otherUserId });
      toast.success('Chat reopened! You can now send messages.');

      // Socket event 'chat:reopened' will update the state automatically
      // No need to reload the page
    } catch (error: any) {
      console.error('Error reopening chat:', error);
      toast.error(error.message || 'Failed to reopen chat');
    } finally {
      setIsReopeningChat(false);
    }
  };

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20">
        <div className="text-center space-y-4 p-8">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-white">Select a conversation</h3>
          <p className="text-gray-400 max-w-md">
            Choose a conversation from the list or start a new chat with an astrologer
          </p>
        </div>
      </div>
    );
  }

  // Determine other user based on current user ID
  const otherUser =
    chat.clientParticipant.id === currentUserId
      ? chat.astrologerParticipant
      : chat.clientParticipant;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          <Avatar className="h-10 w-10">
            <AvatarImage
              src={getImageUrl(otherUser.profilePhoto) || undefined}
              alt={otherUser.name || otherUser.phone || 'User'}
            />
            <AvatarFallback className="font-bold">
              {(otherUser.name || otherUser.phone || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div>
            <h2 className="font-semibold text-gray-900">
              {otherUser.name || otherUser.phone || 'Unknown User'}
            </h2>
            <p className="text-xs text-gray-500">
              {isTyping ? (
                <span className="text-indigo-600">typing...</span>
              ) : onlineUsers.has(otherUser.id) ? (
                <span className="text-green-600">● Online</span>
              ) : (
                <span className="text-gray-400">Offline</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* End Chat button - only show if chat is active and not locked */}
          {chat?.status === 'ACTIVE' && !chat?.isLocked && (
            <Tooltip content="End chat session">
              <button
                onClick={handleEndChat}
                disabled={isEndingChat}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PhoneOff className="h-5 w-5" />
              </button>
            </Tooltip>
          )}

          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 bg-gray-50"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : uniqueMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4 p-8">
            <div className="text-6xl mb-2">👋</div>
            <p className="text-xl font-semibold text-gray-700">
              Say hello to {otherUser.name || otherUser.phone || 'Unknown User'}!
            </p>
            <p className="text-sm text-gray-500 text-center max-w-md">
              Start your conversation by sending a greeting.{' '}
              {otherUser.role === UserRole.ASTROLOGER
                ? 'Ask about your cosmic journey!'
                : 'Respond to their query!'}
            </p>
            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-700">
                💡 <strong>Tip:</strong> Be polite and clear in your communication
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Loading More Indicator */}
            {isLoadingMore && (
              <div className="flex justify-center py-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Spinner />
                  <span>Loading older messages...</span>
                </div>
              </div>
            )}

            {/* End of messages indicator */}
            {!hasMore && uniqueMessages.length > 0 && (
              <div className="flex justify-center py-3 mb-2">
                <div className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  🎉 Beginning of conversation
                </div>
              </div>
            )}

            {uniqueMessages.map((message, index) => {
              // Check if it's a system message
              const isSystemMsg = 'isSystemMessage' in message && message.isSystemMessage;

              if (isSystemMsg) {
                return (
                  <div key={message.id} className="flex justify-center my-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 max-w-md">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-800">{message.content}</p>
                      </div>
                    </div>
                  </div>
                );
              }

              // Type assertion after checking it's not a system message
              const regularMessage = message as Message;
              const isOwn = regularMessage.senderId === currentUserId;

              // Show avatar for opposite party only on last message in consecutive group
              const nextMessage = uniqueMessages[index + 1];
              const nextIsSystem = nextMessage && 'isSystemMessage' in nextMessage;
              const showAvatar =
                index === uniqueMessages.length - 1 ||
                nextIsSystem ||
                (nextMessage && (nextMessage as Message).senderId !== regularMessage.senderId);

              // Show timestamp if:
              // 1. It's the last message OR
              // 2. More than 5 minutes have passed since this message OR
              // 3. Next message is from a different sender
              let showTimestamp = false;
              if (index === uniqueMessages.length - 1) {
                // Always show timestamp on last message
                showTimestamp = true;
              } else if (nextMessage && !nextIsSystem) {
                const currentTime = new Date(regularMessage.createdAt).getTime();
                const nextTime = new Date(nextMessage.createdAt).getTime();
                const timeDiffMinutes = (nextTime - currentTime) / (1000 * 60);

                // Show if more than 5 minutes apart or different sender
                showTimestamp =
                  timeDiffMinutes > 5 ||
                  (nextMessage as Message).senderId !== regularMessage.senderId;
              } else {
                showTimestamp = true;
              }

              return (
                <MessageBubble
                  key={regularMessage.id}
                  message={regularMessage}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  showTimestamp={showTimestamp}
                />
              );
            })}

            {/* Waiting for Reply Indicator - Only show for clients */}
            {user?.role === UserRole.CLIENT && waitingForReply && !isLoading && (
              <div className="flex justify-center my-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 max-w-md">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">
                        Waiting for {chat?.astrologerParticipant?.name || 'astrologer'} to reply
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        You&apos;ll be able to send another message once you receive a reply.
                      </p>
                      {lastClientMessageTime && (
                        <p className="text-xs text-blue-600 mt-2">
                          Message sent: {new Date(lastClientMessageTime).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Inline Rating Component - Show after chat ends for clients */}
            {user?.role === UserRole.CLIENT &&
              chat?.isLocked &&
              !isLoading &&
              uniqueMessages.length > 0 && (
                <InlineChatRating
                  chatId={chat.id}
                  astrologerId={chat.astrologerParticipant.id}
                  astrologerName={chat.astrologerParticipant.name!}
                  clientId={currentUserId}
                />
              )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input or Blocked Message */}
      {(chat as any)?.isAbandonedByAdmin ? (
        <div className="px-4 py-6 bg-red-50 border-t border-red-200">
          <div className="flex flex-col items-center justify-center gap-4 text-red-600">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
              <PhoneOff className="h-6 w-6 text-red-600" />
            </div>
            <div className="text-center max-w-md">
              <p className="font-semibold text-red-900">Conversation Ended by Administration</p>
              <p className="text-sm text-red-700 mt-1">
                You do not have the authority to start or continue this conversation. This chat has
                been restricted by the administration.
              </p>
              {(chat as any)?.abandonReason && (
                <p className="text-xs text-red-600 mt-2 italic">
                  Reason: {(chat as any).abandonReason}
                </p>
              )}
              {user?.role === UserRole.CLIENT && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setShowComplaintForm(true);
                      setComplaintSubject('Request to Reopen Conversation');
                      setComplaintCategory(ComplaintCategory.OTHER);
                      setComplaintDescription(
                        `I would like to request the reopening of this conversation.\n\nReason for request: `
                      );
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Request to Reopen Chat
                  </button>
                  <p className="text-xs text-red-600 mt-2">
                    Submit a request to the administration to reopen this conversation
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : chat?.isLocked ? (
        <div className="px-4 py-6 bg-gray-100 border-t border-gray-200">
          <div className="flex flex-col items-center justify-center gap-4 text-gray-600">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
              <PhoneOff className="h-6 w-6 text-red-600" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">Chat Session Ended</p>
              <p className="text-sm text-gray-600 mt-1">You can no longer message this person</p>
            </div>

            {/* Reopen button - only show for clients */}
            {user?.role === UserRole.CLIENT && (
              <Button
                onClick={handleReopenChat}
                disabled={isReopeningChat}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReopeningChat ? (
                  <>
                    <Spinner />
                    <span>Opening Chat...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-5 w-5" />
                    <span>Chat Again</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Waiting for Reply Banner - only for clients */}
          {user?.role === UserRole.CLIENT && waitingForReply && (
            <div className="px-4 py-3 bg-blue-50 border-t border-blue-200">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600 animate-pulse flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Waiting for Reply</p>
                    <p className="text-xs text-blue-700">
                      Please wait for {chat?.astrologerParticipant?.name || 'the astrologer'} to
                      respond.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowComplaintForm(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors flex-shrink-0"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Contact Support</span>
                </button>
              </div>
            </div>
          )}

          {/* Chat Input - Always visible but disabled when waiting */}
          <ChatInput
            onSendMessage={handleSendMessage}
            onTyping={onTyping}
            onFocus={onInputFocus}
            disabled={!isConnected || (user?.role === UserRole.CLIENT && waitingForReply)}
            placeholder={
              user?.role === UserRole.CLIENT && waitingForReply
                ? 'Please wait for astrologer to reply...'
                : isConnected
                  ? 'Type a message...'
                  : 'Connecting to chat server...'
            }
          />
        </>
      )}

      {/* End Chat Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showEndChatConfirm}
        onClose={() => setShowEndChatConfirm(false)}
        onConfirm={handleConfirmEndChat}
        title="End Chat Session"
        description="Are you sure you want to end this conversation? This action cannot be undone."
        confirmText="End Chat"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isEndingChat}
      />

      {/* Complaint Submission Dialog */}
      {showComplaintForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-black/95 backdrop-blur-xl rounded-xl shadow-2xl max-w-md w-full max-h-[60vh] flex flex-col border border-white/10 overflow-hidden">
            {/* Header - Fixed */}
            <div className="flex items-start justify-between p-4 border-b border-white/10 bg-white/5 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">Contact Support</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Submit a complaint about this conversation
                </p>
              </div>
              <button
                onClick={() => setShowComplaintForm(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg flex-shrink-0"
                disabled={submitComplaintMutation.isPending}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Form Content - Scrollable */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {/* Info Alert */}
              <div className="flex items-start gap-2 p-2.5 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <AlertCircle className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-300">
                  <p className="font-semibold text-white mb-0.5">Submit a Complaint</p>
                  <p className="text-gray-400">
                    Our admin team will review your complaint and take appropriate action.
                  </p>
                </div>
              </div>

              {/* Subject */}
              <div>
                <Label htmlFor="complaint-subject" className="text-sm font-medium text-gray-300">
                  Subject *
                </Label>
                <Input
                  id="complaint-subject"
                  placeholder="Brief summary of the issue"
                  value={complaintSubject}
                  onChange={(e) => setComplaintSubject(e.target.value)}
                  className="mt-1 bg-black text-white border-gray-600 focus:bg-white focus:text-black focus:border-blue-500 focus:ring-blue-500 hover:bg-white hover:text-black placeholder:text-gray-500 transition-colors"
                  maxLength={100}
                  disabled={submitComplaintMutation.isPending}
                />
                <p className="text-xs text-gray-500 mt-0.5">
                  {complaintSubject.length}/100 characters
                </p>
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="complaint-category" className="text-sm font-medium text-gray-300">
                  Category *
                </Label>
                <select
                  id="complaint-category"
                  value={complaintCategory}
                  onChange={(e) => setComplaintCategory(e.target.value as ComplaintCategory)}
                  className="mt-1 w-full px-3 py-2 bg-black text-white border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white focus:text-black hover:bg-white hover:text-black transition-colors"
                  disabled={submitComplaintMutation.isPending}
                >
                  {Object.entries(COMPLAINT_CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <Label
                  htmlFor="complaint-description"
                  className="text-sm font-medium text-gray-300"
                >
                  Detailed Description *
                </Label>
                <p className="text-xs text-gray-500 mt-1 mb-1.5 space-y-0.5">
                  <span className="block font-medium text-gray-400">Please explain:</span>
                  <span className="block">• What happened?</span>
                  <span className="block">• Who was involved?</span>
                  <span className="block">• Why is this a problem?</span>
                </p>
                <Textarea
                  id="complaint-description"
                  placeholder="Provide detailed information about your complaint..."
                  value={complaintDescription}
                  onChange={(e) => setComplaintDescription(e.target.value)}
                  rows={3}
                  className="mt-1 resize-none bg-black text-white border-gray-600 focus:bg-white focus:text-black focus:border-blue-500 focus:ring-blue-500 hover:bg-white hover:text-black placeholder:text-gray-500 transition-colors"
                  maxLength={1000}
                  disabled={submitComplaintMutation.isPending}
                />
                <p className="text-xs text-gray-500 mt-0.5">
                  {complaintDescription.length}/1000 characters
                </p>
              </div>

              {/* Attachment */}
              <div>
                <Label htmlFor="complaint-attachment" className="text-sm font-medium text-gray-300">
                  Attachment (Optional)
                </Label>
                <p className="text-xs text-gray-500 mt-1 mb-1.5">
                  Upload a screenshot or image as evidence (e.g., payment receipt, error screenshot)
                </p>
                <input
                  type="file"
                  id="complaint-attachment"
                  accept="image/*"
                  onChange={(e) => setComplaintAttachment(e.target.files?.[0] || null)}
                  disabled={submitComplaintMutation.isPending}
                  className="mt-1 w-full px-3 py-2 bg-black text-white border border-gray-600 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                {complaintAttachment && (
                  <p className="text-xs text-green-400 mt-1.5 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {complaintAttachment.name} ({(complaintAttachment.size / 1024).toFixed(1)} KB)
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Max file size: 10MB. Supported formats: JPEG, PNG, GIF, WebP
                </p>
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="flex gap-3 p-4 border-t border-white/10 bg-white/5 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowComplaintForm(false);
                  setComplaintSubject('');
                  setComplaintDescription('');
                  setComplaintCategory(ComplaintCategory.SLOW_RESPONSE);
                }}
                className="flex-1 border-white/20 text-gray-300 hover:bg-white/10 hover:text-white"
                disabled={submitComplaintMutation.isPending}
              >
                Cancel
              </Button>
              <LoadingButton
                onClick={handleSubmitComplaint}
                isLoading={submitComplaintMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={!complaintSubject.trim() || !complaintDescription.trim()}
              >
                Submit Complaint
              </LoadingButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
