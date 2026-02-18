/**
 * Horoscope - Admin constants (Rashi + category options)
 */

import type { HoroscopeCategory } from '@/types';

export const HOROSCOPE_CATEGORIES: HoroscopeCategory[] = [
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'YEARLY',
];

export const ZODIAC_SIGNS = [
  'ARIES',
  'TAURUS',
  'GEMINI',
  'CANCER',
  'LEO',
  'VIRGO',
  'LIBRA',
  'SCORPIO',
  'SAGITTARIUS',
  'CAPRICORN',
  'AQUARIUS',
  'PISCES',
] as const;
