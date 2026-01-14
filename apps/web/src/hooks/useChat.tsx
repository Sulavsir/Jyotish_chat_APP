/**
 * useChat Hook - Helper for initiating and managing chats
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import chatService from '@/services/chat.service';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { UserRole } from '@/types';
import { displayError } from '@/utils/error-handler';
import { ROUTE_BUILDERS, QUERY_KEYS } from '@/constants';
import { CoinPurchaseModal } from '@/components/modals';

export function useChat() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [showCoinPurchaseModal, setShowCoinPurchaseModal] = useState(false);
  const [requiredCoins, setRequiredCoins] = useState(0);
  const [pendingChatParams, setPendingChatParams] = useState<{
    otherUserId: string;
    consultationId?: string;
  } | null>(null);

  /**
   * Extract required coins from error message
   */
  const extractRequiredCoins = (errorMessage: string): number => {
    const match = errorMessage.match(/Required:\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : 1;
  };

  /**
   * Start a chat with another user
   * @param otherUserId - The user ID to chat with
   * @param consultationId - Optional consultation ID to link
   * @returns The chat ID
   */
  const startChat = async (otherUserId: string, consultationId?: string) => {
    if (!user) {
      toast.error('Please login to start a chat');
      return null;
    }

    if (otherUserId === user.id) {
      toast.error('You cannot chat with yourself');
      return null;
    }

    try {
      setIsStartingChat(true);

      // Get or create the chat
      const chat = await chatService.getOrCreateChat({
        otherUserId,
        consultationId,
      });

      // Validate chat response
      if (!chat || !chat.id) {
        console.error('Invalid chat response from server');
        throw new Error('Invalid chat response from server');
      }

      // Navigate to the appropriate chat page based on user role
      if (user.role === UserRole.ASTROLOGER) {
        router.push(ROUTE_BUILDERS.JYOTISH_CHAT_WITH_ID(chat.id));
      } else {
        router.push(ROUTE_BUILDERS.CHAT_WITH_ID(chat.id));
      }

      // Invalidate coin balance so UI reflects deducted coins
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });

      return chat.id;
    } catch (error: unknown) {
      console.error('Error starting chat:', error);

      // Our apiClient wraps backend errors into plain Error with a message string.
      // Detect insufficient coins by inspecting the error message.
      const errorMessage =
        error instanceof Error ? error.message : 'Insufficient coins to start chat';
      const isInsufficientCoins =
        typeof errorMessage === 'string' &&
        errorMessage.toLowerCase().startsWith('insufficient coins');

      if (isInsufficientCoins) {
        const coins = extractRequiredCoins(errorMessage);

        // Show toast and open coin purchase modal
        toast.error(errorMessage);

        // Store pending chat params and open purchase modal
        setPendingChatParams({ otherUserId, consultationId });
        setRequiredCoins(coins);
        setShowCoinPurchaseModal(true);
        return null;
      }

      // For other errors, show error toast
      displayError(error, 'Failed to start chat. Please try again.');
      return null;
    } finally {
      setIsStartingChat(false);
    }
  };

  /**
   * Retry chat after coin purchase
   */
  const retryChat = async () => {
    if (!pendingChatParams) return;

    // Store info for after purchase
    sessionStorage.setItem(
      'pendingChatAfterPurchase',
      JSON.stringify({
        hasCallback: true,
        otherUserId: pendingChatParams.otherUserId,
        consultationId: pendingChatParams.consultationId,
      })
    );

    setShowCoinPurchaseModal(false);

    // Listen for coins purchased event
    const handleCoinsPurchased = () => {
      window.removeEventListener('coinsPurchased', handleCoinsPurchased);
      // Retry the chat after a short delay
      setTimeout(() => {
        startChat(pendingChatParams!.otherUserId, pendingChatParams!.consultationId);
      }, 500);
    };

    window.addEventListener('coinsPurchased', handleCoinsPurchased);
  };

  /**
   * Navigate to chat with a specific user
   */
  const navigateToChat = (chatId: string) => {
    if (user?.role === UserRole.ASTROLOGER) {
      router.push(ROUTE_BUILDERS.JYOTISH_CHAT_WITH_ID(chatId));
    } else {
      router.push(ROUTE_BUILDERS.CHAT_WITH_ID(chatId));
    }
  };

  return {
    startChat,
    navigateToChat,
    isStartingChat,
    showCoinPurchaseModal,
    requiredCoins,
    retryChat,
    setShowCoinPurchaseModal,
  };
}

/**
 * Coin Purchase Modal Wrapper Component
 */
export function CoinPurchaseModalWrapper({
  isOpen,
  onClose,
  requiredCoins,
  onPurchaseSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  requiredCoins: number;
  onPurchaseSuccess?: () => void;
}) {
  return (
    <CoinPurchaseModal
      isOpen={isOpen}
      onClose={onClose}
      requiredCoins={requiredCoins}
      onPurchaseSuccess={onPurchaseSuccess}
    />
  );
}
