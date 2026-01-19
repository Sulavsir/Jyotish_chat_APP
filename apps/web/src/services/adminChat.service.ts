/**
 * Admin Chat Service
 * Handles admin chat API calls
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';

export interface AdminChat {
  id: string;
  userId: string | null;
  astrologerId?: string | null;
  adminId: string | null;
  status: 'ACTIVE' | 'RESOLVED' | 'CLOSED';
  lastMessageAt: Date | string | null;
  lastMessageText: string | null;
  userRead: boolean;
  adminRead: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string;
    profilePhoto: string | null;
  };
  astrologer?: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string;
    profilePhoto: string | null;
  };
  admin?: {
    id: string;
    name: string | null;
    email: string | null;
  };
  unreadCount?: number;
}

export interface AdminChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderType: 'USER' | 'ADMIN';
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE';
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateAdminChatRequest {
  initialMessage: string;
}

export interface SendAdminChatMessageRequest {
  chatId: string;
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE';
  metadata?: Record<string, unknown> | null;
}

export interface AdminChatListResponse {
  chats: AdminChat[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminChatMessagesResponse {
  messages: AdminChatMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminChatUploadedFile {
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: 'IMAGE' | 'FILE' | 'AUDIO';
}

class AdminChatService {
  /**
   * Create a new admin chat
   */
  async createChat(data: CreateAdminChatRequest): Promise<{ chat: AdminChat }> {
    return apiClient.post<{ chat: AdminChat }>(API_ENDPOINTS.ADMIN_CHAT.CREATE, data);
  }

  /**
   * Get user's admin chats
   */
  async getUserChats(): Promise<{ chats: AdminChat[] }> {
    return apiClient.get<{ chats: AdminChat[] }>(API_ENDPOINTS.ADMIN_CHAT.MY);
  }

  /**
   * Get chat by ID
   */
  async getChatById(chatId: string): Promise<{ chat: AdminChat }> {
    return apiClient.get<{ chat: AdminChat }>(`${API_ENDPOINTS.ADMIN_CHAT.BASE}/${chatId}`);
  }

  /**
   * Get chat messages
   */
  async getChatMessages(
    chatId: string,
    params?: { page?: number; limit?: number }
  ): Promise<AdminChatMessagesResponse> {
    return apiClient.get<AdminChatMessagesResponse>(
      `${API_ENDPOINTS.ADMIN_CHAT.BASE}/${chatId}/messages`,
      { params }
    );
  }

  /**
   * Send message
   */
  async sendMessage(data: SendAdminChatMessageRequest): Promise<{ message: AdminChatMessage }> {
    return apiClient.post<{ message: AdminChatMessage }>(
      `${API_ENDPOINTS.ADMIN_CHAT.BASE}/${data.chatId}/messages`,
      data
    );
  }

  /**
   * Mark messages as read
   */
  async markAsRead(chatId: string): Promise<{ message: string }> {
    return apiClient.patch<{ message: string }>(
      `${API_ENDPOINTS.ADMIN_CHAT.BASE}/${chatId}/read`
    );
  }

  /**
   * Upload file for admin chat
   */
  async uploadFile(file: File): Promise<AdminChatUploadedFile> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.uploadFile<{ file: AdminChatUploadedFile }>(
      API_ENDPOINTS.ADMIN_CHAT.UPLOAD_FILE,
      formData
    );

    return response.file;
  }
}

export const adminChatService = new AdminChatService();
export default adminChatService;
