'use client';

import { useNepaliDateConvert } from '@/hooks/useNepaliDateConvert';
import { useQuestionnaireLanguageStore } from '@/store/questionnaire-language.store';

interface FormattedDateProps {
  date: string;
  className?: string;
}

/**
 * Renders a date in the user's selected language: Nepali (Bikram Sambat) when
 * language is NEPALI, otherwise English format. Use anywhere a single date string
 * (ISO or YYYY-MM-DD) should be shown language-aware.
 */
export function FormattedDate({ date, className }: FormattedDateProps) {
  const language = useQuestionnaireLanguageStore((s) => s.language);
  const { getDisplayDate } = useNepaliDateConvert([date], language);
  return <span className={className}>{getDisplayDate(date)}</span>;
}
