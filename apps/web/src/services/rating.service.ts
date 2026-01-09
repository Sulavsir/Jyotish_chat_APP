/**
 * Rating Service
 * Frontend service for rating operations
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api.constants';
import type {
  CreateRatingRequest,
  CreateRatingResponse,
  GetRatingsResponse,
  GetSingleRatingResponse,
  CanRateResponse,
  GetRatingStatsResponse,
} from '@/types/rating';

class RatingService {
  /**
   * Create a new rating for an astrologer
   */
  async createRating(data: CreateRatingRequest): Promise<CreateRatingResponse> {
    const response = await apiClient.post<CreateRatingResponse>(API_ENDPOINTS.RATINGS.CREATE, data);
    return response;
  }

  /**
   * Get ratings for an astrologer
   */
  async getAstrologerRatings(
    astrologerId: string,
    params?: { limit?: number; page?: number }
  ): Promise<GetRatingsResponse> {
    const response = await apiClient.get<GetRatingsResponse>(
      API_ENDPOINTS.RATINGS.ASTROLOGER(astrologerId),
      { params }
    );
    return response;
  }

  /**
   * Get rating for a specific chat
   */
  async getChatRating(chatId: string): Promise<GetSingleRatingResponse> {
    const response = await apiClient.get<GetSingleRatingResponse>(
      API_ENDPOINTS.RATINGS.CHAT(chatId)
    );
    return response;
  }

  /**
   * Get ratings given by the current client
   */
  async getMyRatings(): Promise<GetRatingsResponse> {
    const response = await apiClient.get<GetRatingsResponse>(API_ENDPOINTS.RATINGS.MY_RATINGS);
    return response;
  }

  /**
   * Check if a chat can be rated
   */
  async canRateChat(chatId: string): Promise<CanRateResponse> {
    const response = await apiClient.get<CanRateResponse>(API_ENDPOINTS.RATINGS.CAN_RATE(chatId));
    return response;
  }

  /**
   * Get rating statistics for an astrologer
   */
  async getAstrologerRatingStats(astrologerId: string): Promise<GetRatingStatsResponse> {
    const response = await apiClient.get<GetRatingStatsResponse>(
      API_ENDPOINTS.RATINGS.ASTROLOGER_STATS(astrologerId)
    );
    return response;
  }
}

export const ratingService = new RatingService();
