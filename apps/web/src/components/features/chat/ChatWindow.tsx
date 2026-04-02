/**
 * ChatWindow Component
 * Main chat interface showing messages and input
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  Textarea,
  Label,
  Input,
  Badge,
} from '@jyotish/ui';
import {
  ArrowLeft,
  MoreVertical,
  PhoneOff,
  MessageCircle,
  MessageSquare,
  Clock,
  AlertCircle,
  AlertTriangle,
  User,
  History,
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
import { Chat, Message, type FileAttachment } from '@/types/chat';
import { useAuthStore } from '@/store/auth-store';
import { useSocket } from '@/hooks/useSocket';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useChatBirthDetailsNepaliMap } from '@/hooks/useChatBirthDetailsNepaliMap';
import complaintService from '@/services/complaint.service';
import { clientHasChatHistory as clientHasChatHistoryFn } from '@/services/clientChatHistory.service';
import { ComplaintCategory, COMPLAINT_CATEGORY_LABELS } from '@/types/complaint';
import { InlineChatRating } from '@/components/features/ratings';
import { ERROR_CODES, QUERY_KEYS } from '@/constants';
import {
  ClientDetailsModal,
  SelectProfileModal,
  ClientChatHistoryModal,
} from '@/components/modals';
import type { ClientProfile } from '@jyotish/shared';
import {
  CHAT_MESSAGE_MAX_LENGTH_CLIENT,
  CHAT_MESSAGE_MAX_LENGTH_ASTROLOGER,
} from '@jyotish/shared';
import { ChatClientQuestionBundle } from './ChatClientQuestionBundle';

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
  onSendMessage: (content: string, attachment?: FileAttachment) => void;
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
  /** When 'jyotish', uses dark glass styling to match Jyotish portal */
  variant?: 'default' | 'jyotish';
  /** When 'dark', the empty state (no conversation selected) uses dark theme; rest of chat unchanged */
  emptyStateTheme?: 'light' | 'dark';
  /** Client only: selected profile for birth details shown to Jyotish */
  selectedProfileId?: string;
  /** Client only: called when user changes profile in Select Profile modal */
  onProfileChange?: (profileId: string) => void;
  /** Client only: family profiles for displaying current profile name */
  familyProfiles?: ClientProfile[];
  /** Optional per-chat draft value (used for Jyotish chat to preserve input drafts) */
  draftValue?: string;
  /** Called whenever the input draft changes */
  onDraftChange?: (value: string) => void;
  /** Client: after send-direct-question-bundle succeeds — migrate new-chat, reload messages */
  onDirectQuestionBundleSent?: (result: {
    chatId: string;
    messageCount: number;
    coinsDeducted: number;
  }) => void | Promise<void>;
  onInsufficientCoinsForBundle?: (requiredNr: number) => void;
  onQuestionBundleProfileIncomplete?: (missingFields: string[]) => void;
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
  variant = 'default',
  emptyStateTheme = 'light',
  selectedProfileId = 'me',
  onProfileChange,
  familyProfiles = [],
  draftValue,
  onDraftChange,
  onDirectQuestionBundleSent,
  onInsufficientCoinsForBundle,
  onQuestionBundleProfileIncomplete,
}) => {
  const isJyotish = variant === 'jyotish';
  const emptyStateDark = emptyStateTheme === 'dark';
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
  const [showClientDetailsModal, setShowClientDetailsModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showSelectProfileModal, setShowSelectProfileModal] = useState(false);
  const [showClientChatHistoryModal, setShowClientChatHistoryModal] = useState(false);
  const onlineUsers = useStore((state) => state.onlineUsers);
  const user = useAuthStore((state) => state.user);
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const previousScrollHeight = useRef<number>(0);
  const isLoadingMoreRef = useRef(false);
  const previousChatId = useRef<string | null>(null);

  const clientIdForHistory = chat?.clientParticipant?.id ?? null;

  const { data: hasClientChatHistoryData } = useQuery({
    queryKey: QUERY_KEYS.CLIENT_CHAT_HISTORY.HAS_HISTORY(clientIdForHistory ?? ''),
    queryFn: () => clientHasChatHistoryFn(clientIdForHistory!),
    enabled: !!clientIdForHistory && user?.role === UserRole.ASTROLOGER && !!chat,
    staleTime: 60_000,
  });

  const hasClientChatHistory = hasClientChatHistoryData?.hasHistory ?? false;

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
    onError: (error: unknown) => {
      const err = error instanceof Error ? error : new Error(String(error));
      toast.error(err.message || 'Failed to submit complaint. Please try again.');
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
  const handleSendMessage = (content: string, attachment?: FileAttachment) => {
    // If client is sending a message and turn-based is enabled, set waiting state immediately
    if (user?.role === UserRole.CLIENT && chat?.turnBasedEnabled !== false) {
      console.log('💬 [ChatWindow] Client sending message, setting waiting state');
      setWaitingForReply(true);
      setLastClientMessageTime(new Date());
    }

    // Call the parent's onSendMessage
    onSendMessage(content, attachment);
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
    const handleMessageSent = (data: {
      chatId: string;
      turnState?: { waitingForReply?: boolean; lastClientMessageAt?: string };
      coinsDeducted?: number;
    }) => {
      if (data.chatId !== chat.id) return;

      console.log('📤 [ChatWindow] Message sent event:', data);

      // Toast + refetch handled by chat page handleSentInNewMode only (avoids duplicate toast)

      if (user?.role === UserRole.CLIENT && data.turnState) {
        console.log('🔄 [ChatWindow] Updating client turn state:', data.turnState);
        setWaitingForReply(data.turnState.waitingForReply ?? false);
        if (data.turnState.lastClientMessageAt) {
          setLastClientMessageTime(new Date(data.turnState.lastClientMessageAt));
        }
      }
    };

    // Listen for received messages to update turn state
    const handleMessageReceived = (data: {
      chatId: string;
      turnState?: { waitingForReply?: boolean };
    }) => {
      if (data.chatId !== chat.id) return;

      console.log('📥 [ChatWindow] Message received event:', data);

      // If client receives a message, they can reply now (no longer waiting)
      if (user?.role === UserRole.CLIENT) {
        if (data.turnState) {
          console.log('🔄 [ChatWindow] Updating client turn state from received:', data.turnState);
          setWaitingForReply(data.turnState.waitingForReply ?? false);
        } else {
          // If no turn state in message, assume client can now reply
          console.log('✅ [ChatWindow] Client received message, can now reply');
          setWaitingForReply(false);
        }
      }
    };

    // Listen for new messages from the astrologer
    const handleNewMessage = (message: { chatId: string; senderId: string }) => {
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
  }, [socket, chat, user, queryClient]);

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

  const { nepaliConvertMap, isNepaliConvertLoading } = useChatBirthDetailsNepaliMap(
    uniqueMessages as Message[],
    currentUserId,
    user?.role
  );

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
    } catch (error: unknown) {
      console.error('Error ending chat:', error);
      const err = error instanceof Error ? error : new Error(String(error));
      toast.error(err.message || 'Failed to end chat');
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
    } catch (error: unknown) {
      console.error('Error reopening chat:', error);
      // Check if it's insufficient coins error
      const axiosError = error as {
        response?: { data?: { error?: { code?: string; message?: string } } };
      };
      const errorCode = axiosError?.response?.data?.error?.code;

      if (errorCode === ERROR_CODES.INSUFFICIENT_COINS) {
        const errorMessage = axiosError?.response?.data?.error?.message || 'Insufficient balance';
        const match = errorMessage.match(/Required:\s*(\d+)/i);
        const requiredCoins = match ? parseInt(match[1], 10) : 1;

        // Store pending chat info
        sessionStorage.setItem(
          'pendingChatAfterPurchase',
          JSON.stringify({
            hasCallback: false,
            otherUserId,
          })
        );

        // Redirect to pricing page with required coins info
        window.location.href = `/pricing?requiredCoins=${requiredCoins}`;
        return;
      }

      toast.error((error as Error)?.message || 'Failed to reopen chat');
    } finally {
      setIsReopeningChat(false);
    }
  };

  if (!chat) {
    const useDarkEmpty = emptyStateDark || isJyotish;
    return (
      <div
        className={`flex items-center justify-center h-full ${
          useDarkEmpty ? 'bg-transparent' : 'bg-gradient-to-br from-purple-900/20 to-blue-900/20'
        }`}
      >
        <div className="text-center space-y-4 p-8">
          <div className={useDarkEmpty ? 'text-4xl mb-2' : 'text-6xl mb-4'}>
            {useDarkEmpty ? <MessageCircle className="h-16 w-16 mx-auto text-[#78716c]" /> : '💬'}
          </div>
          <h3
            className={
              useDarkEmpty
                ? 'text-lg font-semibold text-[#fafaf9]'
                : 'text-xl font-semibold text-white'
            }
          >
            Select a conversation
          </h3>
          <p
            className={useDarkEmpty ? 'text-sm text-[#78716c] max-w-md' : 'text-gray-400 max-w-md'}
          >
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
  const showClientIconFallback =
    otherUser.role === UserRole.CLIENT && !otherUser.profilePhoto && !otherUser.name;

  return (
    <div className="flex min-h-0 flex-col h-full bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="lg:hidden hover:bg-gray-100"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <Avatar className="h-10 w-10">
            <AvatarImage
              src={getImageUrl(otherUser.profilePhoto) || undefined}
              alt={otherUser.name || otherUser.phone || 'User'}
            />
            <AvatarFallback className="font-bold">
              {showClientIconFallback ? (
                <User className="h-5 w-5" />
              ) : (
                (otherUser.name || otherUser.phone || 'U').charAt(0).toUpperCase()
              )}
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
          {/* Select Profile badge - only for clients: choose whose birth details to share with Jyotish */}
          {user?.role === UserRole.CLIENT && onProfileChange && (
            <Badge
              variant="outline"
              className="cursor-pointer bg-purple-500 hover:bg-pink-500 text-white border-purple-400/50 transition-all px-3 py-1.5 font-medium"
              onClick={() => setShowSelectProfileModal(true)}
            >
              <User className="h-3.5 w-3.5 mr-1.5" />
              Change Profile
            </Badge>
          )}
          {user?.role === UserRole.ASTROLOGER && otherUser.role === UserRole.CLIENT && (
            <>
              <Badge
                variant="outline"
                className="cursor-pointer bg-blue-400 hover:bg-blue-800 text-white transition-all px-3 py-1.5 font-medium"
                onClick={() => {
                  setSelectedClientId(otherUser.id);
                  setShowClientDetailsModal(true);
                }}
              >
                <User className="h-3.5 w-3.5 mr-1.5" />
                View Profile Details
              </Badge>
              {hasClientChatHistory && (
                <Badge
                  variant="outline"
                  className="cursor-pointer bg-slate-600 hover:bg-slate-700 text-white border-slate-500 transition-all px-3 py-1.5 font-medium"
                  onClick={() => setShowClientChatHistoryModal(true)}
                >
                  <History className="h-3.5 w-3.5 mr-1.5" />
                  Client Chat History
                </Badge>
              )}
            </>
          )}

          {chat?.status === 'ACTIVE' && !chat?.isLocked && (
            <Tooltip content="End chat session">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEndChat}
                disabled={isEndingChat}
                aria-label="End Chat Session"
              >
                <PhoneOff className="h-5 w-6 text-red-400 " />
              </Button>
            </Tooltip>
          )}

          <Button variant="ghost" size="icon" className="h-9 w-9">
            <MoreVertical className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto p-4 bg-gray-50"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : uniqueMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 p-8 text-gray-400">
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
            {isLoadingMore && (
              <div className="flex justify-center py-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Spinner />
                  <span>Loading older messages...</span>
                </div>
              </div>
            )}

            {!hasMore && uniqueMessages.length > 0 && (
              <div className="flex justify-center py-3 mb-2">
                <div className="text-xs px-3 py-1 rounded-full text-gray-400 bg-gray-100">
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
                showTimestamp = true;
              } else if (nextMessage && !nextIsSystem) {
                const currentTime = new Date(regularMessage.createdAt).getTime();
                const nextTime = new Date(nextMessage.createdAt).getTime();
                const timeDiffMinutes = (nextTime - currentTime) / (1000 * 60);
                showTimestamp =
                  timeDiffMinutes > 5 ||
                  (nextMessage as Message).senderId !== regularMessage.senderId;
              } else {
                showTimestamp = true;
              }

              // Birth-details deduplication for batch broadcast questions:
              // Only the LAST message of each batch should render the birth-details card.
              // Same for direct send-direct-question-bundle (metadata.directQuestionBundle + batchId).
              // For non-batch messages let MessageBubble decide (undefined = auto).
              let showBirthDetails: boolean | undefined = undefined;
              const msgMeta =
                (regularMessage.metadata as Record<string, unknown> | undefined) ?? {};
              const batchId = typeof msgMeta.batchId === 'string' ? msgMeta.batchId : null;
              const isOriginalBroadcast = msgMeta.originalBroadcast === true;
              const isDirectQuestionBundle = msgMeta.directQuestionBundle === true;

              if (isOriginalBroadcast && batchId) {
                // Find the last message in this batch among all visible messages
                let lastBatchIndex = index;
                for (let j = index + 1; j < uniqueMessages.length; j++) {
                  const candidate = uniqueMessages[j];
                  if ('isSystemMessage' in candidate) break;
                  const candidateMeta =
                    ((candidate as Message).metadata as Record<string, unknown> | undefined) ?? {};
                  if (
                    candidateMeta.originalBroadcast === true &&
                    candidateMeta.batchId === batchId
                  ) {
                    lastBatchIndex = j;
                  } else {
                    break;
                  }
                }
                // Only the last batch question shows the birth details
                showBirthDetails = index === lastBatchIndex;
              } else if (isDirectQuestionBundle && batchId) {
                let lastBatchIndex = index;
                for (let j = index + 1; j < uniqueMessages.length; j++) {
                  const candidate = uniqueMessages[j];
                  if ('isSystemMessage' in candidate) break;
                  const candidateMeta =
                    ((candidate as Message).metadata as Record<string, unknown> | undefined) ?? {};
                  if (
                    candidateMeta.directQuestionBundle === true &&
                    candidateMeta.batchId === batchId
                  ) {
                    lastBatchIndex = j;
                  } else {
                    break;
                  }
                }
                showBirthDetails = index === lastBatchIndex;
              }

              return (
                <MessageBubble
                  key={regularMessage.id}
                  message={regularMessage}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  showTimestamp={showTimestamp}
                  showBirthDetails={showBirthDetails}
                  variant={isJyotish ? 'jyotish' : 'default'}
                  onViewProfile={
                    user?.role === UserRole.ASTROLOGER &&
                    !isOwn &&
                    otherUser.role === UserRole.CLIENT
                      ? (_clientId: string) => {
                          setShowClientDetailsModal(true);
                        }
                      : undefined
                  }
                  nepaliBatch={
                    user?.role === UserRole.ASTROLOGER
                      ? { map: nepaliConvertMap, isLoading: isNepaliConvertLoading }
                      : undefined
                  }
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
      {chat?.isAbandonedByAdmin ? (
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
              {chat?.abandonReason && (
                <p className="text-xs text-red-600 mt-2 italic">Reason: {chat.abandonReason}</p>
              )}
              {user?.role === UserRole.CLIENT && (
                <div className="mt-4">
                  <Button
                    onClick={() => {
                      setShowComplaintForm(true);
                      setComplaintSubject('Request to Reopen Conversation');
                      setComplaintCategory(ComplaintCategory.OTHER);
                      setComplaintDescription(
                        `I would like to request the reopening of this conversation.\n\nReason for request: `
                      );
                    }}
                    className="inline-flex items-center gap-2"
                    color="info"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Request to Reopen Chat
                  </Button>
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
              <p className="mt-1 text-sm text-gray-600">You can no longer message this person</p>
              {user?.role === UserRole.CLIENT && (
                <p className="mt-2 font-medium text-gray-700">Want to ask one more question?</p>
              )}
            </div>

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
        <div className="flex min-h-0 flex-col bg-white">
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
                <Button
                  variant="outline"
                  color="warning"
                  size="sm"
                  onClick={() => setShowComplaintForm(true)}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Contact Support</span>
                </Button>
              </div>
            </div>
          )}

          {user?.role === UserRole.CLIENT &&
            chat &&
            onDirectQuestionBundleSent &&
            onInsufficientCoinsForBundle && (
              <ChatClientQuestionBundle
                astrologerId={chat.astrologerParticipant.id}
                isBroadcastOriginatedChat={chat.isBroadcastChat === true}
                disabled={!isConnected || waitingForReply}
                selectedProfileId={selectedProfileId}
                familyProfiles={familyProfiles as ClientProfile[]}
                user={user}
                onSuccess={(res) => {
                  void onDirectQuestionBundleSent(res);
                  setWaitingForReply(true);
                }}
                onInsufficientCoins={onInsufficientCoinsForBundle}
                onProfileIncomplete={onQuestionBundleProfileIncomplete}
              />
            )}

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
            variant={isJyotish ? 'jyotish' : 'default'}
            initialValue={draftValue ?? ''}
            onChangeMessage={onDraftChange}
            maxMessageLength={
              user?.role === UserRole.ASTROLOGER
                ? CHAT_MESSAGE_MAX_LENGTH_ASTROLOGER
                : CHAT_MESSAGE_MAX_LENGTH_CLIENT
            }
          />
        </div>
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowComplaintForm(false)}
                className="text-gray-400 hover:text-white flex-shrink-0"
                disabled={submitComplaintMutation.isPending}
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
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

      {/* Select Profile Modal - client only: choose whose birth details to share with Jyotish */}
      {user?.role === UserRole.CLIENT && onProfileChange && (
        <SelectProfileModal
          isOpen={showSelectProfileModal}
          onClose={() => setShowSelectProfileModal(false)}
          onConfirm={(profileId) => {
            onProfileChange(profileId);
            setShowSelectProfileModal(false);
          }}
          defaultSelectedProfileId={selectedProfileId}
          title="Select profile"
          confirmLabel="Use this profile"
        />
      )}

      {/* Client Details Modal */}
      {user?.role === UserRole.ASTROLOGER && (
        <ClientDetailsModal
          isOpen={showClientDetailsModal}
          onClose={() => {
            setShowClientDetailsModal(false);
            setSelectedClientId(null);
          }}
          clientId={selectedClientId || (otherUser.role === UserRole.CLIENT ? otherUser.id : null)}
        />
      )}

      {/* Client Chat History Modal (anonymous aggregated view) */}
      {user?.role === UserRole.ASTROLOGER && chat?.clientParticipant && (
        <ClientChatHistoryModal
          isOpen={showClientChatHistoryModal}
          onClose={() => setShowClientChatHistoryModal(false)}
          clientId={chat.clientParticipant.id}
          clientName={chat.clientParticipant.name || chat.clientParticipant.phone}
        />
      )}
    </div>
  );
};
