/**
 * Broadcast Message Service
 * Frontend service for "Everyone Jyotish" broadcast messaging
 */

import { apiClient } from '@/lib/api-client';

export interface BroadcastMessage {
  id: string;
  clientId: string;
  content: string;
  type: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  acceptedBy?: string;
  chatId?: string;
  acceptedAt?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string | null;
    phone: string;
    profilePhoto: string | null;
  };
  acceptedAstrologer?: {
    id: string;
    name: string | null;
    phone: string;
    profilePhoto: string | null;
  };
}

const broadcastMessageService = {
  /**
   * Send a broadcast message to all astrologers (client only)
   */
  async sendMessage(content: string, type: string = 'TEXT'): Promise<BroadcastMessage> {
    const response = await apiClient.post<BroadcastMessage>('/api/v1/broadcast-messages', {
      content,
      type,
    });
    return response;
  },

  /**
   * Get pending broadcast messages (astrologer only)
   */
  async getPendingMessages(): Promise<BroadcastMessage[]> {
    const response = await apiClient.get<BroadcastMessage[]>('/api/v1/broadcast-messages/pending');
    return response;
  },

  /**
   * Get all broadcast messages including accepted (astrologer only)
   */
  async getAllMessages(): Promise<BroadcastMessage[]> {
    const response = await apiClient.get<BroadcastMessage[]>('/api/v1/broadcast-messages/all');
    return response;
  },

  /**
   * Get my broadcast messages (client only)
   */
  async getMyMessages(): Promise<BroadcastMessage[]> {
    const response = await apiClient.get<BroadcastMessage[]>(
      '/api/v1/broadcast-messages/my-messages'
    );
    return response;
  },

  /**
   * Accept a broadcast message (astrologer only)
   */
  async acceptMessage(messageId: string): Promise<{ message: BroadcastMessage; chat: any }> {
    const response = await apiClient.post<{ message: BroadcastMessage; chat: any }>(
      `/api/v1/broadcast-messages/${messageId}/accept`
    );
    return response;
  },

  /**
   * Get a specific broadcast message
   */
  async getMessage(messageId: string): Promise<BroadcastMessage> {
    const response = await apiClient.get<BroadcastMessage>(
      `/api/v1/broadcast-messages/${messageId}`
    );
    return response;
  },
};

export default broadcastMessageService;
