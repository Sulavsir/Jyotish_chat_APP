/**
 * Rating Types
 * Type definitions for astrologer ratings
 */

export interface Rating {
  id: string;
  chatId: string;
  clientId: string;
  astrologerId: string;
  rating: number;
  feedback?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name: string | null;
    profilePhoto: string | null;
  };
  astrologer?: {
    id: string;
    name: string;
    profilePhoto: string | null;
  };
  chat?: {
    id: string;
    createdAt: string;
    endedAt: string | null;
  };
}

export interface CreateRatingRequest {
  chatId: string;
  astrologerId: string;
  rating: number;
  feedback?: string;
}

export interface CreateRatingResponse {
  success: boolean;
  data: {
    rating: Rating;
  };
}

export interface GetRatingsResponse {
  success: boolean;
  data: {
    ratings: Rating[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
}

export interface GetSingleRatingResponse {
  success: boolean;
  data: {
    rating: Rating | null;
  };
}

export interface CanRateResponse {
  success: boolean;
  data: {
    canRate: boolean;
    reason?: string;
  };
}

export interface RatingStats {
  averageRating: number;
  totalRatings: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface GetRatingStatsResponse {
  success: boolean;
  data: {
    stats: RatingStats;
  };
}
