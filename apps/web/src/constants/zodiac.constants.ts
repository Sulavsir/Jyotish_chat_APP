/**
 * Zodiac Constants
 */

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

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];
