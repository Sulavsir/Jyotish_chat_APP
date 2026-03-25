// API Constants
export const API_VERSION = 'v1';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Direct chat: max characters per message (socket + HTTP + UI). Clients: 100; astrologers can send longer readings. */
export const CHAT_MESSAGE_MAX_LENGTH_CLIENT = 100;
export const CHAT_MESSAGE_MAX_LENGTH_ASTROLOGER = 10000;

// Consultation durations (in minutes)
export const CONSULTATION_DURATIONS = {
  SHORT: 15,
  MEDIUM: 30,
  LONG: 60,
} as const;

// Zodiac signs with dates
export const ZODIAC_DATES = {
  ARIES: { start: { month: 3, day: 21 }, end: { month: 4, day: 19 } },
  TAURUS: { start: { month: 4, day: 20 }, end: { month: 5, day: 20 } },
  GEMINI: { start: { month: 5, day: 21 }, end: { month: 6, day: 20 } },
  CANCER: { start: { month: 6, day: 21 }, end: { month: 7, day: 22 } },
  LEO: { start: { month: 7, day: 23 }, end: { month: 8, day: 22 } },
  VIRGO: { start: { month: 8, day: 23 }, end: { month: 9, day: 22 } },
  LIBRA: { start: { month: 9, day: 23 }, end: { month: 10, day: 22 } },
  SCORPIO: { start: { month: 10, day: 23 }, end: { month: 11, day: 21 } },
  SAGITTARIUS: { start: { month: 11, day: 22 }, end: { month: 12, day: 21 } },
  CAPRICORN: { start: { month: 12, day: 22 }, end: { month: 1, day: 19 } },
  AQUARIUS: { start: { month: 1, day: 20 }, end: { month: 2, day: 18 } },
  PISCES: { start: { month: 2, day: 19 }, end: { month: 3, day: 20 } },
} as const;

// Job queue names
export const QUEUE_NAMES = {
  HOROSCOPE_DELIVERY: 'horoscope-delivery',
  NOTIFICATION: 'notification',
  EMAIL: 'email',
  SMS: 'sms',
  CONSULTATION_REMINDER: 'consultation-reminder',
  APPOINTMENT_SESSION: 'appointment-session',
} as const;

// Cache keys
export const CACHE_KEYS = {
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  HOROSCOPE_DAILY: (sign: string, date: string) => `horoscope:daily:${sign}:${date}`,
  CHAT_HISTORY: (userId1: string, userId2: string) =>
    `chat:history:${[userId1, userId2].sort().join(':')}`,
  ONLINE_USERS: 'users:online',
} as const;

// Time constants
export const TIME = {
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

// Questionnaire languages (for question categories). Type QuestionnaireLanguage is in types/index.ts
export const QUESTIONNAIRE_LANGUAGES = ['NEPALI', 'HINDI', 'ENGLISH'] as const;

export const LANGUAGE_DISPLAY_LABELS: Record<(typeof QUESTIONNAIRE_LANGUAGES)[number], string> = {
  ENGLISH: 'English',
  NEPALI: 'नेपाली',
  HINDI: 'हिन्दी',
};

// Rashi (zodiac) display names by language for UI (dropdowns, cards)
export const RASHI_DISPLAY_NAMES: Record<
  (typeof QUESTIONNAIRE_LANGUAGES)[number],
  Record<string, string>
> = {
  ENGLISH: {
    ARIES: 'Aries',
    TAURUS: 'Taurus',
    GEMINI: 'Gemini',
    CANCER: 'Cancer',
    LEO: 'Leo',
    VIRGO: 'Virgo',
    LIBRA: 'Libra',
    SCORPIO: 'Scorpio',
    SAGITTARIUS: 'Sagittarius',
    CAPRICORN: 'Capricorn',
    AQUARIUS: 'Aquarius',
    PISCES: 'Pisces',
  },
  NEPALI: {
    ARIES: 'मेष',
    TAURUS: 'वृष',
    GEMINI: 'मिथुन',
    CANCER: 'कर्कट',
    LEO: 'सिंह',
    VIRGO: 'कन्या',
    LIBRA: 'तुला',
    SCORPIO: 'वृश्चिक',
    SAGITTARIUS: 'धनु',
    CAPRICORN: 'मकर',
    AQUARIUS: 'कुम्भ',
    PISCES: 'मीन',
  },
  HINDI: {
    ARIES: 'मेष',
    TAURUS: 'वृषभ',
    GEMINI: 'मिथुन',
    CANCER: 'कर्क',
    LEO: 'सिंह',
    VIRGO: 'कन्या',
    LIBRA: 'तुला',
    SCORPIO: 'वृश्चिक',
    SAGITTARIUS: 'धनु',
    CAPRICORN: 'मकर',
    AQUARIUS: 'कुम्भ',
    PISCES: 'मीन',
  },
};

/** Get rashi display name for a zodiac sign value and language (e.g. for Select Rashi dropdown) */
export function getRashiDisplayName(
  zodiacSignValue: string,
  language: (typeof QUESTIONNAIRE_LANGUAGES)[number] = 'ENGLISH'
): string {
  const names = RASHI_DISPLAY_NAMES[language];
  return names[zodiacSignValue] ?? zodiacSignValue;
}

// Astrologer proof of astrology upload
const ASTROLOGER_PROOF_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
] as const;

export const ASTROLOGER_PROOF_UPLOAD = {
  MAX_FILES: 10,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [...ASTROLOGER_PROOF_ALLOWED_TYPES] as string[],
  isAllowedType: (mimeType: string): boolean =>
    (ASTROLOGER_PROOF_ALLOWED_TYPES as readonly string[]).includes(mimeType),
};

// File upload limits
export const FILE_LIMITS = {
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  FILE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  AUDIO_MAX_SIZE: 20 * 1024 * 1024, // 20MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
} as const;

export * from './jyotish-booking.constants';
export * from './astrologer-commission.constants';
