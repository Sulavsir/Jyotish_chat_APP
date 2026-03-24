/**
 * Client Chat History Service
 * Astrologer-only: fetch anonymous aggregated view of client's past conversations
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';

export interface ClientChatHistoryMessage {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  senderType: 'CLIENT' | 'ASTROLOGER';
  receiverType: 'CLIENT' | 'ASTROLOGER';
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO';
  metadata: unknown;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  senderDisplayName: string;
  senderAvatarLetter: string;
}

export interface ClientChatHistoryResponse {
  messages: ClientChatHistoryMessage[];
  nextCursor: string | null;
}

export interface ClientHasChatHistoryResponse {
  hasHistory: boolean;
}

const DEFAULT_LIMIT = 12;

/**
 * Fetch client's aggregated chat history (anonymized).
 * Cursor-based pagination - pass nextCursor from previous response for older messages.
 */
export async function getClientChatHistory(
  clientId: string,
  cursor?: string | null,
  limit = DEFAULT_LIMIT
): Promise<ClientChatHistoryResponse> {
  const params: Record<string, string | number> = { clientId, limit };
  if (cursor) params.cursor = cursor;

  const result = await apiClient.get<ClientChatHistoryResponse>(
    API_ENDPOINTS.ASTROLOGER.CLIENT_CHAT_HISTORY,
    { params }
  );
  return result ?? { messages: [], nextCursor: null };
}

/**
 * Check if client has previous chat history with any astrologer.
 * Used to conditionally show "Client Chat History" button.
 */
export async function clientHasChatHistory(
  clientId: string
): Promise<ClientHasChatHistoryResponse> {
  const result = await apiClient.get<ClientHasChatHistoryResponse>(
    API_ENDPOINTS.ASTROLOGER.CLIENT_HAS_CHAT_HISTORY(clientId)
  );
  return result ?? { hasHistory: false };
}
