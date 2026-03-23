'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { QUERY_KEYS } from '@/constants';
import { nepaliDateService } from '@/services/nepali-date.service';
import { toDateKey, formatEnglishDateShort, formatNepaliDateCompact } from '@/utils/date-format.utils';
import type { NepaliDateMapping } from '@/services/nepali-date.service';

export interface BirthDetailsNepaliDateResult {
  /** English date display e.g. "06 Mar, 2024" */
  englishDisplay: string;
  /** Nepali (BS) date display e.g. "23 Falgun 2080" */
  nepaliDisplay: string | null;
  /** True while fetching Nepali conversion */
  isLoading: boolean;
}

/**
 * Fetches Nepali (Bikram Sambat) conversion for a DOB and returns both
 * English and Nepali formatted strings for display in profile birth details.
 */
export function useBirthDetailsNepaliDate(
  dateOfBirth: string | Date | null | undefined
): BirthDetailsNepaliDateResult {
  const dateStr = dateOfBirth
    ? typeof dateOfBirth === 'string'
      ? dateOfBirth
      : dateOfBirth instanceof Date
        ? dateOfBirth.toISOString().slice(0, 10)
        : null
    : null;

  const dateKey = useMemo(() => (dateStr ? toDateKey(dateStr) : null), [dateStr]);

  const { data: map, isLoading } = useQuery({
    queryKey: QUERY_KEYS.NEPALI_DATE.CONVERT(dateKey ? [dateKey] : []),
    queryFn: () => nepaliDateService.convertBulk(dateKey ? [dateKey] : []),
    enabled: !!dateKey,
    staleTime: 1000 * 60 * 60, // 1 hour - date mappings are static
  });

  return useMemo((): BirthDetailsNepaliDateResult => {
    if (!dateStr) {
      return { englishDisplay: '', nepaliDisplay: null, isLoading: false };
    }

    const englishDisplay = formatEnglishDateShort(dateStr, true); // include weekday
    const mapping: NepaliDateMapping | undefined = dateKey && map?.[dateKey] ? map[dateKey] : undefined;
    const nepaliDisplay = mapping ? formatNepaliDateCompact(mapping, true) : null; // include weekday

    return {
      englishDisplay,
      nepaliDisplay,
      isLoading,
    };
  }, [dateStr, dateKey, map, isLoading]);
}
