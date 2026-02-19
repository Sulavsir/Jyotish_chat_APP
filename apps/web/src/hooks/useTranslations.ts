'use client';

import { useCallback } from 'react';
import { useQuestionnaireLanguageStore } from '@/store/questionnaire-language.store';
import { getTranslation } from '@/lib/translations';
import type { QuestionnaireLanguage } from '@jyotish/shared';

type TranslationParams = { name?: string; count?: string | number; balance?: string | number };

export function useTranslations() {
  const language = useQuestionnaireLanguageStore((s) => s.language);

  const t = useCallback(
    (key: string, params?: TranslationParams) => {
      return getTranslation(language, key, params);
    },
    [language]
  );

  return { t, language };
}
