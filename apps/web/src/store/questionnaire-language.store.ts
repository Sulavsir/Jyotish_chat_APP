import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuestionnaireLanguage } from '@jyotish/shared';

const DEFAULT_LANGUAGE: QuestionnaireLanguage = 'ENGLISH';

interface QuestionnaireLanguageState {
  language: QuestionnaireLanguage;
  setLanguage: (language: QuestionnaireLanguage) => void;
}

export const useQuestionnaireLanguageStore = create<QuestionnaireLanguageState>()(
  persist(
    (set) => ({
      language: DEFAULT_LANGUAGE,
      setLanguage: (language) => set({ language }),
    }),
    { name: 'questionnaire-language' }
  )
);
