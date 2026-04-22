import { apiClient } from '@/lib/api-client';
import { PUBLIC_API_ENDPOINTS } from '@/constants/api.constants';
import type { NepaliDateMappingInput } from '@jyotish/shared';

export type ConvertNepaliDatesResponse = { map: Record<string, NepaliDateMappingInput> };

export const nepaliDateService = {
  async convertBulk(dates: string[]): Promise<Record<string, NepaliDateMappingInput>> {
    if (dates.length === 0) return {};
    const res = await apiClient.post<ConvertNepaliDatesResponse>(PUBLIC_API_ENDPOINTS.NEPALI_DATE_CONVERT, {
      dates,
    });
    return res?.map ?? {};
  },
};
