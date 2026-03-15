/**
 * Location service – Nepal geography (provinces and districts) for place of birth
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import type { NepalGeography } from '@jyotish/shared';

export const locationService = {
  async getProvinces(): Promise<NepalGeography[]> {
    return apiClient.get<NepalGeography[]>(API_ENDPOINTS.PUBLIC.LOCATION_PROVINCES);
  },

  async getDistricts(provinceId: string): Promise<NepalGeography[]> {
    return apiClient.get<NepalGeography[]>(API_ENDPOINTS.PUBLIC.LOCATION_DISTRICTS(provinceId));
  },
};
