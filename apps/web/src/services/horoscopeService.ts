/**
 * Horoscope Service - Horoscope API calls
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import type { HoroscopeResponse, HoroscopeCategory } from '@/types';

const CATEGORY_ENDPOINTS: Record<HoroscopeCategory, (zodiacSign: string) => string> = {
  DAILY: API_ENDPOINTS.HOROSCOPE.DAILY,
  WEEKLY: API_ENDPOINTS.HOROSCOPE.WEEKLY,
  MONTHLY: API_ENDPOINTS.HOROSCOPE.MONTHLY,
  YEARLY: API_ENDPOINTS.HOROSCOPE.YEARLY,
};

export interface GetHoroscopeParams {
  zodiacSign: string;
  category: HoroscopeCategory;
  date?: string;
}

export interface HoroscopeApiResponse {
  horoscope: HoroscopeResponse;
  message: string;
}

export const horoscopeService = {
  /**
   * Get horoscope for zodiac sign and category (day/week/month/year)
   */
  async getHoroscope(params: GetHoroscopeParams): Promise<HoroscopeApiResponse> {
    const { zodiacSign, category, date } = params;
    const url = CATEGORY_ENDPOINTS[category](zodiacSign);
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return apiClient.get<HoroscopeApiResponse>(`${url}${query}`);
  },

  /**
   * Get my horoscope (authenticated user's sign + daily)
   */
  async getMyHoroscope(): Promise<HoroscopeApiResponse> {
    return apiClient.get<HoroscopeApiResponse>(API_ENDPOINTS.HOROSCOPE.MY_HOROSCOPE);
  },

  /**
   * Subscribe to horoscope notifications
   */
  async subscribe(frequency: string = 'DAILY', deliveryTime: string = '09:00'): Promise<void> {
    await apiClient.post(API_ENDPOINTS.HOROSCOPE.SUBSCRIBE, {
      frequency,
      deliveryTime,
    });
  },

  /**
   * Unsubscribe from horoscope notifications
   */
  async unsubscribe(): Promise<void> {
    await apiClient.post(API_ENDPOINTS.HOROSCOPE.UNSUBSCRIBE);
  },
};
