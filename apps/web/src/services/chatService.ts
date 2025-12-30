/**
 * Chat Service - Chat API calls
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS, PAGINATION } from '@/constants';
import type { ApiResponse, ChatMessage } from '@/types';

interface Conversation {
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  lastMessage: string;
  lastMessageTime: Date;
  isRead: boolean;
}

export const chatService = {
  /**
   * Get chat history with a user
   */
  async getChatHistory(
    userId: string,
    page: number = PAGINATION.DEFAULT_PAGE
  ): Promise<ChatMessage[]> {
    return await apiClient.get<ChatMessage[]>(API_ENDPOINTS.CHAT.HISTORY(userId), {
      params: {
        page,
        limit: PAGINATION.CHAT_LIMIT,
      },
    });
  },

  /**
   * Get all conversations
   */
  async getConversations(): Promise<Conversation[]> {
    return await apiClient.get<Conversation[]>(API_ENDPOINTS.CHAT.CONVERSATIONS);
  },
};
