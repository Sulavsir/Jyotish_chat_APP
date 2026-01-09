/**
 * useChat Hook - Helper for initiating and managing chats
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import chatService from '@/services/chat.service';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { UserRole } from '@/types';
import { displayError } from '@/utils/error-handler';
import { ROUTE_BUILDERS } from '@/constants';

export function useChat() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [isStartingChat, setIsStartingChat] = useState(false);

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

      return chat.id;
    } catch (error) {
      console.error('Error starting chat:', error);
      displayError(error, 'Failed to start chat. Please try again.');
      return null;
    } finally {
      setIsStartingChat(false);
    }
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
  };
}
