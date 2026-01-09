/**
 * Broadcast Message Service
 * Frontend service for "Channel Jyotish" broadcast messaging
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';

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
    const response = await apiClient.post<BroadcastMessage>(API_ENDPOINTS.BROADCAST.MESSAGES, {
      content,
      type,
    });
    return response;
  },

  /**
   * Get pending broadcast messages (astrologer only)
   */
  async getPendingMessages(): Promise<BroadcastMessage[]> {
    const response = await apiClient.get<BroadcastMessage[]>(API_ENDPOINTS.BROADCAST.PENDING);
    return response;
  },

  /**
   * Get all broadcast messages including accepted (astrologer only)
   */
  async getAllMessages(): Promise<BroadcastMessage[]> {
    const response = await apiClient.get<BroadcastMessage[]>(API_ENDPOINTS.BROADCAST.ALL);
    return response;
  },

  /**
   * Get my broadcast messages (client only)
   */
  async getMyMessages(): Promise<BroadcastMessage[]> {
    const response = await apiClient.get<BroadcastMessage[]>(
      API_ENDPOINTS.BROADCAST.MY_MESSAGES
    );
    return response;
  },

  /**
   * Accept a broadcast message (astrologer only)
   */
  async acceptMessage(messageId: string): Promise<{ message: BroadcastMessage; chat: any }> {
    const response = await apiClient.post<{ message: BroadcastMessage; chat: any }>(
      API_ENDPOINTS.BROADCAST.ACCEPT(messageId)
    );
    return response;
  },

  /**
   * Get a specific broadcast message
   */
  async getMessage(messageId: string): Promise<BroadcastMessage> {
    const response = await apiClient.get<BroadcastMessage>(
      API_ENDPOINTS.BROADCAST.MESSAGE_BY_ID(messageId)
    );
    return response;
  },
};

export default broadcastMessageService;
