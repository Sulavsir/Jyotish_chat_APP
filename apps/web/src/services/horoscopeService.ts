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
  language?: string;
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
    const { zodiacSign, category, date, language } = params;
    const url = CATEGORY_ENDPOINTS[category](zodiacSign);
    const search = new URLSearchParams();
    if (date) search.set('date', date);
    if (language) search.set('language', language);
    const query = search.toString() ? `?${search.toString()}` : '';
    return apiClient.get<HoroscopeApiResponse>(`${url}${query}`);
  },

  /**
   * Get my horoscope (authenticated user's sign + daily), optionally by language
   */
  async getMyHoroscope(language?: string): Promise<HoroscopeApiResponse> {
    const url = language
      ? `${API_ENDPOINTS.HOROSCOPE.MY_HOROSCOPE}?language=${encodeURIComponent(language)}`
      : API_ENDPOINTS.HOROSCOPE.MY_HOROSCOPE;
    return apiClient.get<HoroscopeApiResponse>(url);
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
