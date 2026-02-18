/**
 * Subha Sahit Service - Auspicious dates for Pandit Ji bookings
 */

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
}

export interface AvailableDatesResponse {
  dates: SubhaSahitDate[];
}

export interface OccasionsResponse {
  occasions: string[];
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
   * Get all unique occasions
   */
  async getOccasions(): Promise<OccasionsResponse> {
    return apiClient.get<OccasionsResponse>(API_ENDPOINTS.SUBHA_SAHIT.OCCASIONS);
  },
};
