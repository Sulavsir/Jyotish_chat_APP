/**
 * Broadcast Message Service
 * Frontend service for "Channel Jyotish" broadcast messaging
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import type {
  BroadcastMessage,
  CreateBroadcastMessageRequest,
  AcceptBroadcastMessageResponse,
  DismissBroadcastMessageResponse,
  CancelBroadcastMessageResponse,
  BroadcastQuestionPricingResponse,
  PrepareBroadcastQuestionsResponse,
  SendBroadcastQuestionsRequest,
  SendBroadcastQuestionsResponse,
} from '@/types';

const broadcastMessageService = {
  /**
   * Send a broadcast message to all astrologers (client only)
   */
  async sendMessage(data: CreateBroadcastMessageRequest): Promise<BroadcastMessage> {
    const response = await apiClient.post<BroadcastMessage>(API_ENDPOINTS.BROADCAST.MESSAGES, data);
    return response;
  },

  /**
   * Get pending broadcast messages (astrologer only)
   * Automatically filters out messages dismissed by the requesting astrologer
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
    const response = await apiClient.get<BroadcastMessage[]>(API_ENDPOINTS.BROADCAST.MY_MESSAGES);
    return response;
  },

  /**
   * Accept a broadcast message (astrologer only)
   */
  async acceptMessage(messageId: string): Promise<AcceptBroadcastMessageResponse> {
    const response = await apiClient.post<AcceptBroadcastMessageResponse>(
      API_ENDPOINTS.BROADCAST.ACCEPT(messageId)
    );
    return response;
  },

  /**
   * Cancel a pending broadcast message (client only).
   * Refunds coin and notifies astrologers so the request is removed from their list.
   */
  async cancelMessage(messageId: string): Promise<CancelBroadcastMessageResponse> {
    const response = await apiClient.post<CancelBroadcastMessageResponse>(
      API_ENDPOINTS.BROADCAST.CANCEL(messageId)
    );
    return response;
  },

  /**
   * Dismiss/Reject a broadcast message (astrologer only)
   * The message won't be shown to this astrologer again
   */
  async dismissMessage(messageId: string): Promise<DismissBroadcastMessageResponse> {
    const response = await apiClient.post<DismissBroadcastMessageResponse>(
      API_ENDPOINTS.BROADCAST.DISMISS(messageId)
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

  /**
   * Get broadcast question pricing tiers (NRs per question count)
   */
  async getQuestionPricing(): Promise<BroadcastQuestionPricingResponse> {
    const response = await apiClient.get<BroadcastQuestionPricingResponse>(
      API_ENDPOINTS.BROADCAST.QUESTION_PRICING
    );
    return response;
  },

  /**
   * Prepare broadcast: validate questions, get total/balance/remaining.
   * Accepts predefined question IDs and/or free-typed custom texts (both optional,
   * but at least one must be non-empty).
   */
  async prepareQuestions(params: {
    questionIds: string[];
    customTexts?: string[];
  }): Promise<PrepareBroadcastQuestionsResponse> {
    const response = await apiClient.post<PrepareBroadcastQuestionsResponse>(
      API_ENDPOINTS.BROADCAST.PREPARE_QUESTIONS,
      {
        questionIds: params.questionIds,
        customTexts: params.customTexts ?? [],
      }
    );
    return response;
  },

  /**
   * Send multiple broadcast questions (deduct balance, create one message per question)
   */
  async sendQuestions(
    payload: SendBroadcastQuestionsRequest
  ): Promise<SendBroadcastQuestionsResponse> {
    const response = await apiClient.post<SendBroadcastQuestionsResponse>(
      API_ENDPOINTS.BROADCAST.SEND_QUESTIONS,
      payload
    );
    return response;
  },
};

export default broadcastMessageService;
