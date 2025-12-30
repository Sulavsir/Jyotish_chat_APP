/**
 * Chat Service - Frontend API calls for chat functionality
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import {
  Chat,
  Message,
  CreateChatParams,
  GetChatHistoryParams,
  SendMessageParams,
} from '@/types/chat';

/**
 * Get all conversations for the authenticated user
 */
export const getConversations = async (): Promise<Chat[]> => {
  const response = await apiClient.get<Chat[]>(API_ENDPOINTS.CHAT.CONVERSATIONS);

  // Ensure we always return an array
  const conversations = Array.isArray(response) ? response : [];

  return conversations;
};

/**
 * Get or create a chat with another user
 */
export const getOrCreateChat = async (params: CreateChatParams): Promise<Chat> => {
  const response = await apiClient.post<Chat>('/api/v1/chat/chats', params);
  return response;
};

/**
 * Get chat by ID
 */
export const getChatById = async (chatId: string): Promise<Chat> => {
  const response = await apiClient.get<Chat>(`/api/v1/chat/chats/${chatId}`);
  return response;
};

/**
 * Get chat history with a specific user
 */
export const getChatHistory = async (
  params: GetChatHistoryParams
): Promise<{ messages: Message[]; total: number }> => {
  const { otherUserId, limit = 50, offset = 0 } = params;
  const url = `${API_ENDPOINTS.CHAT.HISTORY(otherUserId)}?limit=${limit}&offset=${offset}`;
  const response = await apiClient.get<Message[]>(url);

  // Response is now a flat array of messages
  const messages = Array.isArray(response) ? response : [];

  return {
    messages,
    total: messages.length,
  };
};

/**
 * Send a message (HTTP fallback)
 */
export const sendMessage = async (params: SendMessageParams): Promise<Message> => {
  const response = await apiClient.post<Message>('/api/v1/chat/messages', params);
  return response;
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (chatId: string, messageIds?: string[]): Promise<void> => {
  await apiClient.put(`/api/v1/chat/chats/${chatId}/read`, {
    messageIds,
  });
};

/**
 * Delete a message
 */
export const deleteMessage = async (messageId: string): Promise<void> => {
  await apiClient.delete(`/api/v1/chat/messages/${messageId}`);
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await apiClient.get<{ count: number }>('/api/v1/chat/unread-count');
  return response?.count || 0;
};

/**
 * Search messages
 */
export const searchMessages = async (searchTerm: string, limit = 20): Promise<Message[]> => {
  const url = `/api/v1/chat/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}`;
  const response = await apiClient.get<Message[]>(url);
  return response || [];
};

// Export all functions as default object
/**
 * Upload file for chat
 */
export const uploadChatFile = async (file: File): Promise<{
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: 'IMAGE' | 'FILE' | 'AUDIO';
}> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.uploadFile<{
    file: {
      url: string;
      originalName: string;
      mimeType: string;
      size: number;
      type: 'IMAGE' | 'FILE' | 'AUDIO';
    };
  }>('/api/v1/chat/upload-file', formData);

  return response.file;
};

/**
 * End an active chat
 */
export const endChat = async (chatId: string): Promise<Chat> => {
  const response = await apiClient.put<Chat>(`/api/v1/chat/chats/${chatId}/end`);
  return response;
};

/**
 * Get active chat for current user
 */
export const getActiveChat = async (): Promise<Chat | null> => {
  const response = await apiClient.get<Chat | null>('/api/v1/chat/active-chat');
  return response;
};

const chatService = {
  getConversations,
  getOrCreateChat,
  getChatById,
  getChatHistory,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
  getUnreadCount,
  searchMessages,
  uploadChatFile,
  endChat,
  getActiveChat,
};

export default chatService;
