/**
 * Nepali Date Service - AD/BS month APIs and convert (Bikram Sambat) via API
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import type { AdMonthResponse, BsMonthResponse } from '@/types/nepali-date.types';

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

  /**
   * Get all days for an AD (English) month.
   */
  async getAdMonth(year: number, month: number): Promise<AdMonthResponse> {
    return apiClient.get<AdMonthResponse>(API_ENDPOINTS.PUBLIC.NEPALI_DATE_AD_MONTH, {
      params: { year, month },
    });
  },

  /**
   * Get all days for a BS (Nepali) month.
   */
  async getBsMonth(year: number, month: number): Promise<BsMonthResponse> {
    return apiClient.get<BsMonthResponse>(API_ENDPOINTS.PUBLIC.NEPALI_DATE_BS_MONTH, {
      params: { year, month },
    });
  },
};
