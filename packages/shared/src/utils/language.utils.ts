/**
 * Language Utilities - Convert between different language code formats
 */

import type { QuestionnaireLanguage } from '../types';

/**
 * API language code type (lowercase 2-letter codes)
 */
export type ApiLanguageCode = 'en' | 'ne' | 'hi';

/**
 * Database language code type (uppercase 2-letter codes)
 */
export type DbLanguageCode = 'EN' | 'NE' | 'HI';

/**
 * Convert QuestionnaireLanguage to API language code (lowercase 2-letter)
 * Used for API requests
 */
export function toApiLanguageCode(language: QuestionnaireLanguage): ApiLanguageCode {
  switch (language) {
    case 'NEPALI':
      return 'ne';
    case 'HINDI':
      return 'hi';
    case 'ENGLISH':
    default:
      return 'en';
  }
}

/**
 * Convert QuestionnaireLanguage to Database language code (uppercase 2-letter)
 * Used for database queries
 */
export function toDbLanguageCode(language: QuestionnaireLanguage): DbLanguageCode {
  switch (language) {
    case 'NEPALI':
      return 'NE';
    case 'HINDI':
      return 'HI';
    case 'ENGLISH':
    default:
      return 'EN';
  }
}

/**
 * Convert API language code to QuestionnaireLanguage
 */
export function fromApiLanguageCode(code: string): QuestionnaireLanguage {
  const normalized = code.toLowerCase();
  switch (normalized) {
    case 'ne':
    case 'np':
    case 'nepali':
      return 'NEPALI';
    case 'hi':
    case 'hin':
    case 'hindi':
      return 'HINDI';
    case 'en':
    case 'eng':
    case 'english':
    default:
      return 'ENGLISH';
  }
}

/**
 * Convert Database language code to QuestionnaireLanguage
 */
export function fromDbLanguageCode(code: string): QuestionnaireLanguage {
  const normalized = code.toUpperCase();
  switch (normalized) {
    case 'NE':
      return 'NEPALI';
    case 'HI':
      return 'HINDI';
    case 'EN':
    default:
      return 'ENGLISH';
  }
}

/**
 * Normalize any language input to DbLanguageCode
 * Useful for backend services that accept various formats
 */
export function normalizeToDbLanguageCode(language?: string): DbLanguageCode {
  if (!language) return 'EN';
  
  const code = language.toLowerCase();
  switch (code) {
    case 'ne':
    case 'np':
    case 'nepali':
      return 'NE';
    case 'hi':
    case 'hin':
    case 'hindi':
      return 'HI';
    case 'en':
    case 'eng':
    case 'english':
    default:
      return 'EN';
  }
}

/**
 * Get display name for a language
 */
export function getLanguageDisplayName(
  language: QuestionnaireLanguage,
  format: 'english' | 'native' | 'both' = 'english'
): string {
  const names: Record<QuestionnaireLanguage, { english: string; native: string }> = {
    ENGLISH: { english: 'English', native: 'English' },
    NEPALI: { english: 'Nepali', native: 'नेपाली' },
    HINDI: { english: 'Hindi', native: 'हिन्दी' },
  };

  const entry = names[language];
  switch (format) {
    case 'native':
      return entry.native;
    case 'both':
      return entry.english === entry.native
        ? entry.english
        : `${entry.native} (${entry.english})`;
    case 'english':
    default:
      return entry.english;
  }
}
