/**
 * Broadcast Chat Window
 * Special chat window for "Channel Jyotish" broadcast messaging
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@jyotish/ui';
import { useAuthStore } from '@/store/auth-store';
import { useSocket } from '@/hooks/useSocket';
import type { BroadcastMessage } from '@/types';
import { BroadcastMessageStatus } from '@/types';
import broadcastMessageService from '@/services/broadcastMessage.service';
import chatService from '@/services/chat.service';
import coinService from '@/services/coin.service';
import { Send, Users, Check, Lock, XCircle, AlertCircle, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { getImageUrl } from '@/utils/image.utils';
import { Avatar, AvatarImage, AvatarFallback } from '@jyotish/ui';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { LoadingButton } from '@/components/ui';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { BROADCAST_MESSAGE_EXPIRY_MS } from '@/constants/broadcastMessage.constants';
import { ROUTE_BUILDERS, QUERY_KEYS } from '@/constants';
import { useCoinRates } from '@/hooks/useCoinRates';
import { ProfileIncompleteDialog } from '@/components/ui/ProfileIncompleteDialog';
import { checkClientProfileCompletion } from '@/utils/profile-completion';
import { CoinPurchaseModal } from '@/components/modals';
// import { JyotishMatchingModal } from '@/components/ui/JyotishMatchingModal';

interface BroadcastChatWindowProps {
  onChatCreated?: (chatId: string) => void;
}

export function BroadcastChatWindow({ onChatCreated }: BroadcastChatWindowProps) {
  const user = useAuthStore((state) => state.user);
  const { socket, isConnected } = useSocket();
  const { rates } = useCoinRates(!!user);
  const broadcastSendCoins = rates?.BROADCAST_SEND;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isWaitingForAcceptance, setIsWaitingForAcceptance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasActiveChat, setHasActiveChat] = useState(false);
  const [showProfileIncompleteDialog, setShowProfileIncompleteDialog] = useState(false);
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([]);
  const [showCoinPurchaseModal, setShowCoinPurchaseModal] = useState(false);
  const [requiredCoins, setRequiredCoins] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false); // ✅ Prevent duplicate loads

  // Extract required coins from backend error message (no client-side rate fallback)
  const extractRequiredCoins = React.useCallback((errorMessage: string): number | undefined => {
    const match = errorMessage.match(/Required:\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : undefined;
  }, []);

  // Load broadcast messages and check for active chat
  useEffect(() => {
    console.log('🔄 [BroadcastChatWindow] Component mounted');

    // Prevent duplicate initialization
    if (loadingRef.current) {
      console.log('⚠️ [BroadcastChatWindow] Already loading, skipping...');
      return;
    }
    loadingRef.current = true;

    loadMessages();
    checkActiveChat();

    return () => {
      console.log('🔄 [BroadcastChatWindow] Component unmounted');
    };
  }, []);

  // Auto-scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages.length, isLoading]);

  // Check if user has an active chat (with messages)
  async function checkActiveChat() {
    try {
      console.log('🔍 [BroadcastChatWindow] Checking for active chat...');
      const activeChat = await chatService.getActiveChat();
      setHasActiveChat(!!activeChat);
      console.log(
        `✅ [BroadcastChatWindow] Active chat status: ${!!activeChat ? 'HAS ACTIVE CHAT' : 'NO ACTIVE CHAT'}`
      );
    } catch (error) {
      console.error('❌ [BroadcastChatWindow] Error checking active chat:', error);
    }
  }

  // Setup socket listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for confirmation that message was sent
    socket.on('broadcast:messageSent', (message: BroadcastMessage) => {
      console.log('✅ [BroadcastChatWindow] Broadcast message sent successfully');
      setMessages((prev) => [...prev, message]); // Add new message at the end (bottom)
      setIsSending(false);
      // Start waiting for acceptance - modal should stay open
      setIsWaitingForAcceptance(true);

      // Invalidate coin balance query to reflect real-time deduction
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });

      // Re-check active chat status after sending (in case this creates an active conversation)
      checkActiveChat();

      // Auto-scroll to bottom to show new message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    socket.on(
      'broadcast:yourMessageAccepted',
      (data: {
        message: BroadcastMessage;
        chat: { id: string };
        astrologer: BroadcastMessage['acceptedAstrologer'];
        initialMessages?: unknown[];
      }) => {
        const { message, chat, astrologer } = data;

        setIsSending(false);
        setIsWaitingForAcceptance(false);

        const acceptedAstrologer = astrologer ?? undefined;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === message.id
              ? ({
                  ...msg,
                  status: BroadcastMessageStatus.ACCEPTED,
                  acceptedAstrologer: acceptedAstrologer ?? msg.acceptedAstrologer,
                  chatId: chat.id,
                } as BroadcastMessage)
              : msg
          )
        );

        toast.success(
          `${astrologer?.name || 'An astrologer'} accepted your request! Opening chat...`,
          {
            description: 'You can now start chatting with your astrologer',
            duration: 3000,
          }
        );

        // Navigate to the chat immediately
        // The chat will already have the initial messages (user's broadcast + astrologer's welcome)
        router.push(ROUTE_BUILDERS.CHAT_WITH_ID(chat.id));

        // Notify parent callback
        if (onChatCreated && chat.id) {
          onChatCreated(chat.id);
        }
      }
    );

    socket.on('broadcast:messageCancelled', (data: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId ? { ...m, status: BroadcastMessageStatus.CANCELLED } : m
        )
      );
      setIsWaitingForAcceptance(false);
    });

    socket.on('broadcast:error', (error: { message?: string; code?: string }) => {
      const errorMessage = error.message || 'Something went wrong';

      // Special handling for different error types
      if (error.code === 'ACTIVE_CHAT_EXISTS') {
        toast.error(errorMessage, {
          duration: 5000,
          description: 'End your current chat before starting a new one.',
        });
      } else if (
        errorMessage.toLowerCase().includes('insufficient coins') ||
        errorMessage.toLowerCase().includes('required:')
      ) {
        // Extract required coins from backend error and open purchase modal
        const coins = extractRequiredCoins(errorMessage);
        if (coins != null) setRequiredCoins(coins);
        setShowCoinPurchaseModal(true);
        toast.error(errorMessage, {
          duration: 5000,
          description: 'Please top up your balance to send a broadcast message.',
        });
      } else if (errorMessage.includes('complete your profile')) {
        toast.error(errorMessage, {
          duration: 5000,
          description: 'Please complete your profile before sending a broadcast message.',
        });
      } else {
        toast.error(errorMessage);
      }

      setIsSending(false);
      setIsWaitingForAcceptance(false);
    });

    return () => {
      socket.off('broadcast:messageSent');
      socket.off('broadcast:yourMessageAccepted');
      socket.off('broadcast:messageCancelled');
      socket.off('broadcast:error');
    };
  }, [socket, isConnected, onChatCreated, router, queryClient, extractRequiredCoins]);

  async function loadMessages() {
    try {
      console.log('📡 [BroadcastChatWindow] Loading messages...');
      setIsLoading(true);
      const msgs = await broadcastMessageService.getMyMessages();
      // Sort messages oldest-first (ascending by createdAt) for chat-like experience
      const sortedMessages = (msgs || []).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(sortedMessages);
      console.log(`✅ [BroadcastChatWindow] Loaded ${sortedMessages.length} messages`);
    } catch (error) {
      console.error('❌ [BroadcastChatWindow] Error loading broadcast messages:', error);
      // Don't show error toast on initial load - table might not exist yet
      // Just set empty array
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }

  const cancelBroadcastMutation = useMutation({
    mutationFn: (messageId: string) => broadcastMessageService.cancelMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BROADCAST.MY_MESSAGES });
      toast.success('Request cancelled. Your balance has been refunded.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel request.');
    },
    onSettled: (_data, _error, messageId) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, status: BroadcastMessageStatus.CANCELLED } : m
        )
      );
      setIsWaitingForAcceptance(false);
    },
  });

  // Memoize the onExpire callback to prevent unnecessary re-creations
  const handleMessageExpire = React.useCallback(() => {
    loadMessages();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate time remaining for pending message
  const getTimeRemaining = (message: BroadcastMessage): number => {
    const createdAt = new Date(message.createdAt).getTime();
    const expiresAt = createdAt + BROADCAST_MESSAGE_EXPIRY_MS;
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
    return remaining;
  };

  // Find the most recent pending message for modal (only show while waiting for acceptance)
  const pendingMessage = isWaitingForAcceptance
    ? messages.find((msg) => msg.status === BroadcastMessageStatus.PENDING)
    : null;

  // Also close modal if message expires
  useEffect(() => {
    if (pendingMessage) {
      const createdAt = new Date(pendingMessage.createdAt).getTime();
      const expiresAt = createdAt + BROADCAST_MESSAGE_EXPIRY_MS;
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      if (timeUntilExpiry <= 0) {
        setIsWaitingForAcceptance(false);
        return;
      }

      const timeout = setTimeout(() => {
        setIsWaitingForAcceptance(false);
      }, timeUntilExpiry);

      return () => clearTimeout(timeout);
    } else {
      setIsWaitingForAcceptance(false);
    }
  }, [pendingMessage]);

  async function handleSendMessage() {
    if (!inputText.trim() || isSending || !socket || !isConnected) return;

    // Check if client profile is complete before sending message
    const profileCheck = checkClientProfileCompletion(user);
    if (!profileCheck.isComplete) {
      setMissingProfileFields(profileCheck.missingFields);
      setShowProfileIncompleteDialog(true);
      return;
    }

    // Check if user has active chat before sending
    if (hasActiveChat) {
      toast.error('You already have an active chat', {
        description: 'End your current chat before starting a new one.',
        duration: 5000,
      });
      return;
    }

    // Pre-check coins only when we have rate from backend (no client fallback)
    if (broadcastSendCoins != null && broadcastSendCoins > 0) {
      try {
        const { balance } = await coinService.getBalance();
        if (balance < broadcastSendCoins) {
          toast.error(
            `Insufficient balance. Required: ${broadcastSendCoins} NRs to send a broadcast message. Available: ${balance} NRs.`
          );
          setRequiredCoins(broadcastSendCoins);
          setShowCoinPurchaseModal(true);
          return;
        }
      } catch (err) {
        toast.error('Failed to check balance. Please try again.');
        return;
      }
    }

    try {
      setIsSending(true);

      // Emit via socket for real-time
      socket.emit('broadcast:sendMessage', {
        content: inputText.trim(),
        type: 'TEXT',
      });

      setInputText('');
    } catch (error) {
      console.error('Error sending broadcast message:', error);
      toast.error('Failed to send message');
      setIsSending(false);
    }
  }

  function renderMessage(message: BroadcastMessage) {
    const isAccepted = message.status === BroadcastMessageStatus.ACCEPTED;
    const isExpired = message.status === BroadcastMessageStatus.EXPIRED;
    const isCancelled = message.status === BroadcastMessageStatus.CANCELLED;

    return (
      <div key={message.id} className="mb-6">
        {/* User's message */}
        <div className="flex justify-end mb-2">
          <div className="max-w-[75%] bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg px-4 py-2 shadow-md">
            <p className="text-white text-sm break-words">{message.content}</p>
            <div className="flex items-center justify-between gap-2 mt-1">
              <p className="text-xs text-purple-200">
                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
              </p>
              {message.status === BroadcastMessageStatus.PENDING && (
                <CountdownTimer
                  createdAt={message.createdAt}
                  expiryMs={BROADCAST_MESSAGE_EXPIRY_MS}
                  className="text-white"
                  showIcon={true}
                  onExpire={handleMessageExpire}
                />
              )}
            </div>
          </div>
        </div>

        {/* Acceptance message */}
        {isAccepted && message.acceptedAstrologer && (
          <div className="flex items-start gap-3 mb-2">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage
                src={getImageUrl(message.acceptedAstrologer.profilePhoto) || undefined}
                alt={message.acceptedAstrologer.name || 'Astrologer'}
              />
              <AvatarFallback className="bg-green-600 text-white font-bold">
                {(message.acceptedAstrologer.name || 'A').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Check className="h-4 w-4 text-green-500" />
                <p className="font-semibold text-green-600 dark:text-green-400 text-sm">
                  {message.acceptedAstrologer.name || 'An astrologer'} accepted your request
                </p>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {formatDistanceToNow(new Date(message.acceptedAt || message.updatedAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        )}

        {/* Expired status */}
        {isExpired && (
          <div className="flex justify-start">
            <div className="max-w-[75%] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                  Request expired
                </p>
              </div>
              <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                No astrologer accepted within 5 minutes
              </p>
            </div>
          </div>
        )}

        {/* Cancelled status */}
        {isCancelled && (
          <div className="flex justify-start">
            <div className="max-w-[75%] bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-slate-500" />
                <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                  Request cancelled
                </p>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Your balance has been refunded.
              </p>
            </div>
          </div>
        )}

        {/* Pending status + Cancel button */}
        {message.status === BroadcastMessageStatus.PENDING && (
          <div className="flex justify-start gap-2 flex-wrap items-center">
            <div className="max-w-[75%] bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-4 py-2 shadow-sm">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Waiting for an astrologer to accept...
              </p>
            </div>
            <LoadingButton
              variant="outline"
              size="sm"
              onClick={() => cancelBroadcastMutation.mutate(message.id)}
              isLoading={cancelBroadcastMutation.isPending}
              disabled={cancelBroadcastMutation.isPending}
              className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
            >
              Cancel request
            </LoadingButton>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <CardHeader className="border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white dark:text-white">Channel Jyotish</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Request Message to all online astrologers
            </p>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 flex items-center justify-center">
              <Users className="h-10 w-10 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white dark:text-white mb-2">
                Start a conversation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                Send a message to broadcast your request to all online astrologers. Any available
                astrologer can accept and chat with you.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => renderMessage(message))}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
        {hasActiveChat && (
          <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-2">
            <Lock className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              You have an active chat. End your current chat before starting a new one.
            </p>
          </div>
        )}
        {!hasActiveChat && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">Cost</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Sending a broadcast message will cost{' '}
                <span className="font-semibold inline-flex items-center gap-1">
                  <Banknote className="h-3 w-3" />
                  {broadcastSendCoins != null
                    ? `${broadcastSendCoins} NRs`
                    : '…'}
                </span>
                . This will be deducted when you send the message.
              </p>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              hasActiveChat
                ? 'End your current chat first...'
                : 'Type your message to all astrologers...'
            }
            disabled={isSending || !isConnected || hasActiveChat}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isSending || !isConnected || hasActiveChat}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 flex items-center gap-2 transition-all"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        {!isConnected && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
            Reconnecting to server...
          </p>
        )}
      </div>

      {/* Profile Incomplete Dialog */}
      <ProfileIncompleteDialog
        isOpen={showProfileIncompleteDialog}
        onClose={() => setShowProfileIncompleteDialog(false)}
        missingFields={missingProfileFields}
      />

      {/* Balance / Top-up Modal */}
      <CoinPurchaseModal
        isOpen={showCoinPurchaseModal}
        onClose={() => setShowCoinPurchaseModal(false)}
        requiredCoins={requiredCoins}
        onPurchaseSuccess={() => {
          setShowCoinPurchaseModal(false);
          // After purchase, balance will be updated and user can retry sending message
        }}
        mode="insufficient"
      />

      {/* Jyotish Matching Modal - Show only while waiting for acceptance */}
      {/* {isWaitingForAcceptance && pendingMessage && (
        <JyotishMatchingModal
          isOpen={isWaitingForAcceptance && !!pendingMessage}
          timeRemaining={getTimeRemaining(pendingMessage)}
          title="Searching for Available Jyotish"
          subtitle="Your message has been broadcasted. Waiting for an astrologer to accept..."
        />
      )} */}
    </div>
  );
}
