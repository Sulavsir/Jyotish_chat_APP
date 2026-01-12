/**
 * Instant Chat Service
 * Frontend service for instant chat requests
 */

import { apiClient } from '@/lib/api-client';

export interface InstantChatRequest {
  id: string;
  clientId: string;
  clientName: string | null;
  clientPhoto: string | null;
  message: string | null;
  status: string;
  expiresAt: string;
  acceptedBy: string | null;
  chatId: string | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create an instant chat request
 */
export const createInstantChatRequest = async (message?: string) => {
  const response = await apiClient.post<InstantChatRequest>('/instant-chat/request', {
    message,
  });
  return response;
};

/**
 * Get all pending instant chat requests (for astrologers)
 */
export const getPendingRequests = async () => {
  const response = await apiClient.get<InstantChatRequest[]>('/instant-chat/pending');
  return response;
};

/**
 * Accept an instant chat request
 */
export const acceptRequest = async (requestId: string) => {
  const response = await apiClient.post<{ request: InstantChatRequest; chatId: string }>(
    `/instant-chat/accept/${requestId}`
  );
  return response;
};

/**
 * Cancel an instant chat request
 */
export const cancelRequest = async (requestId: string) => {
  const response = await apiClient.delete<InstantChatRequest>(`/instant-chat/cancel/${requestId}`);
  return response;
};

/**
 * Get client's active instant chat request
 */
export const getMyActiveRequest = async () => {
  const response = await apiClient.get<InstantChatRequest | null>('/instant-chat/my-request');
  return response;
};

/**
 * Check if astrologer is currently busy
 */
export const checkAstrologerStatus = async () => {
  const response = await apiClient.get<{ isBusy: boolean }>('/instant-chat/status');
  return response;
};

const instantChatService = {
  createInstantChatRequest,
  getPendingRequests,
  acceptRequest,
  cancelRequest,
  getMyActiveRequest,
  checkAstrologerStatus,
};

export default instantChatService;
