'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { nepaliDateService } from '@/services/nepali-date.service';
import {
  toDateKey,
  formatEnglishDateShort,
  formatNepaliDateCompact,
} from '@/utils/date-format.utils';
import type { NepaliDateMapping } from '@/services/nepali-date.service';

export interface BirthDetailsNepaliDateResult {
  /** English date display e.g. "06 Mar, 2024" */
  englishDisplay: string;
  /** Nepali (BS) date display e.g. "23 Falgun 2080" */
  nepaliDisplay: string | null;
  /** True while fetching Nepali conversion */
  isLoading: boolean;
}

export type UseBirthDetailsNepaliDateOptions = {
  /** When true, skip /convert (e.g. parent batched chat-thread convert). */
  skipNepaliApi?: boolean;
};

/**
 * Fetches Nepali (Bikram Sambat) conversion for a DOB and returns both
 * English and Nepali formatted strings for display in profile birth details.
 *
 * Query key uses a single date string so many mounted rows with the same DOB share one request.
 * For chat, prefer {@link useChatBirthDetailsNepaliMap} + `skipNepaliApi` on each row.
 */
export function useBirthDetailsNepaliDate(
  dateOfBirth: string | Date | null | undefined,
  options?: UseBirthDetailsNepaliDateOptions
): BirthDetailsNepaliDateResult {
  const skipNepaliApi = options?.skipNepaliApi === true;
  const dateStr = dateOfBirth
    ? typeof dateOfBirth === 'string'
      ? dateOfBirth
      : dateOfBirth instanceof Date
        ? dateOfBirth.toISOString().slice(0, 10)
        : null
    : null;

  const dateKey = useMemo(() => (dateStr ? toDateKey(dateStr) : null), [dateStr]);

  const { data: map, isLoading } = useQuery({
    queryKey: ['nepali-date', 'convert', dateKey ?? ''] as const,
    queryFn: () => nepaliDateService.convertBulk(dateKey ? [dateKey] : []),
    enabled: !!dateKey && !skipNepaliApi,
    staleTime: 1000 * 60 * 60,
  });

  return useMemo((): BirthDetailsNepaliDateResult => {
    if (!dateStr) {
      return { englishDisplay: '', nepaliDisplay: null, isLoading: false };
    }

    const englishDisplay = formatEnglishDateShort(dateStr, true); // include weekday
    if (skipNepaliApi) {
      return {
        englishDisplay,
        nepaliDisplay: null,
        isLoading: false,
      };
    }

    const mapping: NepaliDateMapping | undefined =
      dateKey && map?.[dateKey] ? map[dateKey] : undefined;
    const nepaliDisplay = mapping ? formatNepaliDateCompact(mapping, true) : null; // include weekday

    return {
      englishDisplay,
      nepaliDisplay,
      isLoading,
    };
  }, [dateStr, dateKey, map, isLoading, skipNepaliApi]);
}
