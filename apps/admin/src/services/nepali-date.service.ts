import { apiClient } from '@/lib/api-client';
import { PUBLIC_API_ENDPOINTS } from '@/constants/api.constants';
import type { NepaliDateMappingInput } from '@jyotish/shared';
import type { BsMonthResponse, NepaliDateMapping } from '@jyotish/ui';

export type ConvertNepaliDatesResponse = { map: Record<string, NepaliDateMappingInput> };

export const nepaliDateService = {
  async getByDate(date: string): Promise<NepaliDateMapping | null> {
    return apiClient.get<NepaliDateMapping | null>(PUBLIC_API_ENDPOINTS.NEPALI_DATE, {
      params: { date },
    });
  },

  async getBsMonth(year: number, month: number): Promise<BsMonthResponse> {
    return apiClient.get<BsMonthResponse>(PUBLIC_API_ENDPOINTS.NEPALI_DATE_BS_MONTH, {
      params: { year, month },
    });
  },

  async convertBulk(dates: string[]): Promise<Record<string, NepaliDateMappingInput>> {
    if (dates.length === 0) return {};
    const res = await apiClient.post<ConvertNepaliDatesResponse>(
      PUBLIC_API_ENDPOINTS.NEPALI_DATE_CONVERT,
      {
        dates,
      }
    );
    return res?.map ?? {};
  },
};
