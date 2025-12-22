// API Constants
export const API_VERSION = 'v1';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

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

// File upload limits
export const FILE_LIMITS = {
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  FILE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  AUDIO_MAX_SIZE: 20 * 1024 * 1024, // 20MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_FILE_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
} as const;

