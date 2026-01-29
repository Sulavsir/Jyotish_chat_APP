/**
 * useChat Hook - Helper for initiating and managing chats
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import chatService from '@/services/chat.service';
import coinService from '@/services/coin.service';
import astrologerService from '@/services/astrologer.service';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { UserRole } from '@/types';
import { displayError } from '@/utils/error-handler';
import { ROUTE_BUILDERS, QUERY_KEYS } from '@/constants';
import { CoinPurchaseModal } from '@/components/modals';
import { AstrologerCategory } from '@/types/astrologer';

/** Coin cost per first message for direct chat (matches backend). PREMIUM = 0 (appointment-only). */
const DIRECT_CHAT_COIN_COSTS: Record<string, number> = {
  [AstrologerCategory.ORDINARY]: 2,
  [AstrologerCategory.PROFESSIONAL]: 2,
  [AstrologerCategory.PREMIUM]: 0,
  [AstrologerCategory.KATHA_VACHAK]: 0,
};

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
   * @param initialMessage - Optional first message content to send after chat is created
   * @param categoryId - Optional category ID for the question (to display as badge)
   * @returns The chat ID
   */
  const startChat = async (
    otherUserId: string,
    consultationId?: string,
    initialMessage?: string,
    categoryId?: string
  ) => {
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

      // Get existing chat (or null if none yet – chat is created on first message)
      const { chat } = await chatService.getOrCreateChat({
        otherUserId,
        consultationId,
      });

      if (chat?.id) {
        // Existing chat: optionally send initial message and navigate
        const trimmedMessage = initialMessage?.trim();
        if (trimmedMessage) {
          try {
            await chatService.sendMessage({
              chatId: chat.id,
              receiverId: otherUserId,
              content: trimmedMessage,
              type: 'TEXT',
              metadata: categoryId
                ? {
                    questionCategory: categoryId,
                  }
                : undefined,
            });
          } catch (sendError) {
            console.error('Error sending initial chat message:', sendError);
            displayError(sendError, 'Chat started, but failed to send your first message.');
          }
        }
        if (user.role === UserRole.ASTROLOGER) {
          router.push(ROUTE_BUILDERS.JYOTISH_CHAT_WITH_ID(chat.id));
        } else {
          router.push(ROUTE_BUILDERS.CHAT_WITH_ID(chat.id));
        }
      } else {
        if (user.role === UserRole.CLIENT) {
          const { balance } = await coinService.getBalance();
          const { astrologer } = await astrologerService.getPublicProfile(otherUserId);
          const requiredCoinsForChat = DIRECT_CHAT_COIN_COSTS[astrologer.category] ?? 2;
          if (requiredCoinsForChat > 0 && balance < requiredCoinsForChat) {
            toast.error(
              `Insufficient coins. Required: ${requiredCoinsForChat} coin${requiredCoinsForChat === 1 ? '' : 's'} to send a message. Available: ${balance} coin${balance === 1 ? '' : 's'}. Please top up your coins.`
            );
            setPendingChatParams({ otherUserId, consultationId });
            setRequiredCoins(requiredCoinsForChat);
            setShowCoinPurchaseModal(true);
            return null;
          }
          const trimmedMessage = initialMessage?.trim();
          if (trimmedMessage && typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(
              'pendingChatMessage',
              JSON.stringify({
                otherUserId,
                content: trimmedMessage,
                categoryId: categoryId ?? undefined,
              })
            );
          }
          router.push(`/chat?otherUserId=${otherUserId}`);
        } else {
          throw new Error('Invalid chat response from server');
        }
      }

      // Invalidate coin balance so UI reflects deducted coins
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });

      return chat?.id ?? null;
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
