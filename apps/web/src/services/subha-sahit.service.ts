/**
 * Subha Sahit Service — auspicious dates for Book Pujari Ji
 */

import type { SubhaSahitOccasionListItem } from '@jyotish/shared';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';

export interface SubhaSahitDate {
  id: string;
  date: string; // ISO date string
  occasion: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetAvailableDatesParams {
  occasion?: string;
  dateFrom?: string;
  dateTo?: string;
  language?: 'en' | 'ne' | 'hi';
}

export interface AvailableDatesResponse {
  dates: SubhaSahitDate[];
}

export interface OccasionsResponse {
  occasions: SubhaSahitOccasionListItem[];
}

export const subhaSahitService = {
  /**
   * Get available dates for Pandit Ji booking
   */
  async getAvailableDates(params?: GetAvailableDatesParams): Promise<AvailableDatesResponse> {
    return apiClient.get<AvailableDatesResponse>(API_ENDPOINTS.SUBHA_SAHIT.AVAILABLE, {
      params,
    });
  },

  /**
   * Occasions for the given app language, with optional puja items and estimated time
   */
  async getOccasions(language?: 'en' | 'ne' | 'hi'): Promise<OccasionsResponse> {
    return apiClient.get<OccasionsResponse>(API_ENDPOINTS.SUBHA_SAHIT.OCCASIONS, {
      params: language ? { language } : undefined,
    });
  },
};
