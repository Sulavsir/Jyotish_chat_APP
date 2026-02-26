/**
 * Nepali Date Service - Convert English dates to Bikram Sambat via API
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';

export interface NepaliDateMapping {
  nepaliDate: string;
  days: string;
}

export interface ConvertNepaliDatesResponse {
  map: Record<string, NepaliDateMapping>;
}

export const nepaliDateService = {
  /**
   * Get Nepali date for a single English date (YYYY-MM-DD).
   */
  async getByDate(date: string): Promise<NepaliDateMapping | null> {
    return apiClient.get<NepaliDateMapping | null>(API_ENDPOINTS.PUBLIC.NEPALI_DATE, {
      params: { date },
    });
  },

  /**
   * Convert multiple English dates to Nepali in one request.
   * Returns record: englishDate (YYYY-MM-DD) -> { nepaliDate, days }.
   */
  async convertBulk(dates: string[]): Promise<ConvertNepaliDatesResponse['map']> {
    if (dates.length === 0) return {};
    const res = await apiClient.post<ConvertNepaliDatesResponse>(
      API_ENDPOINTS.PUBLIC.NEPALI_DATE_CONVERT,
      { dates }
    );
    return res?.map ?? {};
  },
};
