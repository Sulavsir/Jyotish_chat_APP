'use client';

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import { nepaliDateService } from '@/services/nepali-date.service';
import type { BsMonthResponse } from '@/types/nepali-date.types';

/**
 * Fetch a BS (Nepali) month's days via API. Uses TanStack Query for caching and loading state.
 */
export function useBsMonthQuery(year: number, month: number, enabled: boolean) {
  return useQuery<BsMonthResponse>({
    queryKey: QUERY_KEYS.NEPALI_DATE.BS_MONTH(year, month),
    queryFn: () => nepaliDateService.getBsMonth(year, month),
    enabled,
    staleTime: 1000 * 60 * 60,
  });
}
