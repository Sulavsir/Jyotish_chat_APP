/**
 * Admin Chat Types
 */

import { AdminChatStatus, AdminChatSenderType, MessageType } from '@prisma/client';

export interface CreateAdminChatRequest {
  initialMessage: string;
}

export interface SendAdminChatMessageRequest {
  chatId: string;
  content: string;
  type?: MessageType;
  metadata?: Record<string, unknown> | null;
}

export interface AdminChatResponse {
  id: string;
  userId: string | null;
  astrologerId?: string | null;
  adminId: string | null;
  status: AdminChatStatus;
  lastMessageAt: Date | null;
  lastMessageText: string | null;
  userRead: boolean;
  adminRead: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  participantRole?: 'CLIENT' | 'ASTROLOGER';
  unreadCount?: number;
}

export interface AdminChatMessageResponse {
  id: string;
  chatId: string;
  senderId: string;
  senderType: AdminChatSenderType;
  content: string;
  type: MessageType;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminChatListResponse {
  chats: AdminChatResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminChatMessagesResponse {
  messages: AdminChatMessageResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
