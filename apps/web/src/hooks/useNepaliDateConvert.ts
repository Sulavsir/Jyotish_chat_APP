'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { QUERY_KEYS } from '@/constants';
import { nepaliDateService } from '@/services/nepali-date.service';
import { toDateKey, formatEnglishDate, formatNepaliDateDisplay } from '@/utils/date-format.utils';
import type { QuestionnaireLanguage } from '@jyotish/shared';

/**
 * Hook to convert English dates to display strings based on selected language.
 * When language is NEPALI, fetches Nepali (Bikram Sambat) mappings and returns
 * formatted Nepali date; otherwise returns English formatted date.
 *
 * @param dateKeys - Array of date strings (ISO or YYYY-MM-DD) to convert
 * @param language - Current questionnaire language
 * @returns { getDisplayDate, isLoading } - getDisplayDate(dateStr) returns formatted string
 */
export function useNepaliDateConvert(
  dateKeys: string[],
  language: QuestionnaireLanguage
) {
  const normalizedKeys = useMemo(
    () => [...new Set(dateKeys.map(toDateKey).filter(Boolean))],
    [dateKeys]
  );

  const isNepali = language === 'NEPALI';

  const { data: map, isLoading } = useQuery({
    queryKey: QUERY_KEYS.NEPALI_DATE.CONVERT(normalizedKeys),
    queryFn: () => nepaliDateService.convertBulk(normalizedKeys),
    enabled: isNepali && normalizedKeys.length > 0,
    staleTime: 1000 * 60 * 60, // 1 hour - date mappings are static
  });

  const getDisplayDate = useMemo(() => {
    return (dateStr: string): string => {
      const key = toDateKey(dateStr);
      if (!key) return formatEnglishDate(dateStr);

      if (isNepali && map?.[key]) {
        return formatNepaliDateDisplay(map[key]);
      }
      return formatEnglishDate(dateStr);
    };
  }, [isNepali, map]);

  return { getDisplayDate, isLoading: isNepali ? isLoading : false };
}
