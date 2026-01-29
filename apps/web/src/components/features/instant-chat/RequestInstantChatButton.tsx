/**
 * Request Instant Chat Button
 * Allows clients to request instant chat with any available astrologer
 * Works like ride-sharing apps - broadcast to all online astrologers
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@jyotish/ui';
import { MessageSquare, X, AlertCircle, Coins } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { LoadingButton } from '@/components/ui';
import { ROUTE_BUILDERS, ROUTES, QUERY_KEYS } from '@/constants';
import { useAuthStore } from '@/store/auth-store';
import { AnimatedCursorButton } from '@/components/ui/AnimatedCursorButton';
import { JyotishMatchingModal } from '@/components/ui/JyotishMatchingModal';
import { ProfileIncompleteDialog } from '@/components/ui/ProfileIncompleteDialog';
import { checkClientProfileCompletion } from '@/utils/profile-completion';
import {
  BROADCAST_MESSAGE_EXPIRY_MS,
  BROADCAST_CHAT_COIN_COST,
} from '@/constants/broadcastMessage.constants';
import { CoinPurchaseModal } from '@/components/modals';
import broadcastMessageService from '@/services/broadcastMessage.service';
import type { BroadcastMessage } from '@/types';

export const RequestInstantChatButton: React.FC = () => {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isWaitingForAcceptance, setIsWaitingForAcceptance] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<BroadcastMessage | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showProfileIncompleteDialog, setShowProfileIncompleteDialog] = useState(false);
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([]);
  const [showCoinPurchaseModal, setShowCoinPurchaseModal] = useState(false);
  const [requiredCoins, setRequiredCoins] = useState(1);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Extract required coins from error message
  const extractRequiredCoins = (errorMessage: string): number => {
    const match = errorMessage.match(/Required:\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : 1;
  };

  const cancelBroadcastMutation = useMutation({
    mutationFn: (messageId: string) => broadcastMessageService.cancelMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BROADCAST.MY_MESSAGES });
      toast.success('Request cancelled. Your coin has been refunded.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel request. You can try again.');
    },
    onSettled: () => {
      setIsWaitingForAcceptance(false);
      setPendingMessage(null);
    },
  });

  // Listen for socket events (using broadcast message flow)
  useEffect(() => {
    if (!socket || !isConnected) {
      return;
    }

    socket.on('broadcast:messageSent', (msg: BroadcastMessage) => {
      setIsSending(false);
      setIsWaitingForAcceptance(true);
      setPendingMessage(msg);
      setIsModalOpen(false);

      // Invalidate coin balance query to reflect real-time deduction
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
        const { message, chat, astrologer } = data;

        // Close the modal immediately
        setIsSending(false);
        setIsWaitingForAcceptance(false);
        setPendingMessage(null);

        toast.success(
          `${astrologer.name || 'An astrologer'} accepted your request! Opening chat...`,
          {
            description: 'You can now start chatting with your astrologer',
            duration: 3000,
          }
        );

        // Navigate to chat immediately
        router.push(ROUTE_BUILDERS.CHAT_WITH_ID(chat.id));
      }
    );

    socket.on('broadcast:error', (error: { message?: string }) => {
      setIsSending(false);
      setIsWaitingForAcceptance(false);
      setPendingMessage(null);

      const errorMessage = error.message || 'Failed to send message';

      // Special handling for insufficient coins
      if (
        errorMessage.toLowerCase().includes('insufficient coins') ||
        errorMessage.toLowerCase().includes('required:')
      ) {
        // Extract required coins and open purchase modal
        const coins = extractRequiredCoins(errorMessage);
        setRequiredCoins(coins);
        setShowCoinPurchaseModal(true);
        toast.error(errorMessage, {
          duration: 5000,
          description: 'Please top up your coins to send a broadcast message.',
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
  }, [socket, isConnected, router, queryClient]);

  // Update time remaining for pending message
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

  const handleRequestChat = () => {
    if (!socket || !isConnected) {
      toast.error('Connection not ready. Please wait and try again.');
      return;
    }

    // Check if client profile is complete before sending message
    const profileCheck = checkClientProfileCompletion(user);
    if (!profileCheck.isComplete) {
      setMissingProfileFields(profileCheck.missingFields);
      setShowProfileIncompleteDialog(true);
      return;
    }

    setIsSending(true);
    // Use broadcast message flow instead of instant chat
    socket.emit('broadcast:sendMessage', {
      content: message.trim() || 'I would like to chat with an astrologer',
      type: 'TEXT',
    });
  };

  const handleCancelRequest = () => {
    if (pendingMessage?.id) {
      cancelBroadcastMutation.mutate(pendingMessage.id);
    } else {
      setIsWaitingForAcceptance(false);
      setPendingMessage(null);
      toast.info('Request cancelled');
    }
  };

  const handleButtonClick = () => {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
      return;
    }
    setIsModalOpen(true);
  };

  // If waiting for acceptance, show matching modal
  if (isWaitingForAcceptance && pendingMessage) {
    return (
      <>
        {/* Main Button (hidden but keep for ref) */}
        <Button
          ref={buttonRef}
          onClick={handleButtonClick}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg relative opacity-0 pointer-events-none"
          size="lg"
          style={{ position: 'absolute', visibility: 'hidden' }}
        >
          <MessageSquare className="mr-2 h-5 w-5" />
          Request Instant Chat
        </Button>

        {/* Jyotish Matching Modal */}
        <JyotishMatchingModal
          isOpen={isWaitingForAcceptance && !!pendingMessage}
          onCancel={handleCancelRequest}
          timeRemaining={timeRemaining}
          title="Searching for Available Jyotish"
          subtitle="Your message has been broadcasted. Waiting for an astrologer to accept..."
        />
      </>
    );
  }

  return (
    <>
      {/* Animated Cursor Button - Always render for continuous animation */}
      <AnimatedCursorButton
        targetButtonRef={buttonRef}
        delay={1500}
        showOnce={false}
        repeatInterval={6000}
        startPosition="middle"
        cursorColor="#FFFFFF"
        highlightColor="#d8287c"
      />

      {/* Main Button */}
      <Button
        ref={buttonRef}
        onClick={handleButtonClick}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg relative"
        size="lg"
      >
        <MessageSquare className="mr-2 h-5 w-5" />
        Request Instant Chat
      </Button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Request Instant Chat</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Your request will be sent to all online astrologers. The first one to accept will chat
              with you!
            </p>

            {/* Coin Cost Alert */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Coin Cost
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Sending a broadcast message will cost{' '}
                  <span className="font-semibold inline-flex items-center gap-1">
                    <Coins className="h-3 w-3" />
                    {BROADCAST_CHAT_COIN_COST} coin
                  </span>
                  . This will be deducted when you send the message.
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Optional Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Briefly describe what you'd like to discuss..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">{message.length}/200 characters</p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setIsModalOpen(false)}
                variant="outline"
                className="flex-1"
                disabled={isSending}
              >
                Cancel
              </Button>
              <LoadingButton
                onClick={handleRequestChat}
                isLoading={isSending}
                disabled={isSending}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                Send Request
              </LoadingButton>
            </div>
          </div>
        </div>
      )}

      {/* Profile Incomplete Dialog */}
      <ProfileIncompleteDialog
        isOpen={showProfileIncompleteDialog}
        onClose={() => setShowProfileIncompleteDialog(false)}
        missingFields={missingProfileFields}
      />

      {/* Coin Purchase Modal */}
      <CoinPurchaseModal
        isOpen={showCoinPurchaseModal}
        onClose={() => setShowCoinPurchaseModal(false)}
        requiredCoins={requiredCoins}
        onPurchaseSuccess={() => {
          setShowCoinPurchaseModal(false);
          // After purchase, coins will be updated and user can retry sending message
        }}
        mode="insufficient"
      />
    </>
  );
};
