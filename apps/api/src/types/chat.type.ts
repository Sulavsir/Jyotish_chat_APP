import { MessageType } from '@jyotish/shared';

export interface CreateChatParams {
  participant1Id: string;
  participant2Id: string;
  consultationId?: string;
}

export interface SendMessageParams {
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type?: MessageType;
  metadata?: unknown; // JSON metadata - use unknown for type safety
}

export interface GetChatHistoryParams {
  userId: string;
  otherUserId: string;
  limit?: number;
  offset?: number;
}
