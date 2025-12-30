/**
 * Horoscope Service - Horoscope API calls
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import type { ApiResponse, Horoscope, ZodiacSign } from '@/types';

export const horoscopeService = {
  /**
   * Get horoscope for zodiac sign
   */
  async getHoroscope(zodiacSign: ZodiacSign, date?: string): Promise<Horoscope> {
    return await apiClient.get<Horoscope>(API_ENDPOINTS.HOROSCOPE.GET, {
      params: { zodiacSign, date },
    });
  },

  /**
   * Get my daily horoscope
   */
  async getMyDailyHoroscope(): Promise<Horoscope> {
    return await apiClient.get<Horoscope>(API_ENDPOINTS.HOROSCOPE.MY_DAILY);
  },

  /**
   * Subscribe to daily horoscope
   */
  async subscribe(frequency: string = 'DAILY', deliveryTime: string = '09:00'): Promise<void> {
    await apiClient.post(API_ENDPOINTS.HOROSCOPE.SUBSCRIBE, {
      frequency,
      deliveryTime,
    });
  },

  /**
   * Unsubscribe from horoscope
   */
  async unsubscribe(): Promise<void> {
    await apiClient.post(API_ENDPOINTS.HOROSCOPE.UNSUBSCRIBE);
  },
};
