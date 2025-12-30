/**
 * Horoscope Configuration Constants
 */

export const HOROSCOPE_CONFIG = {
  // Default subscription settings
  DEFAULT_FREQUENCY: 'DAILY' as const,
  DEFAULT_DELIVERY_TIME: '09:00',
  
  // Valid zodiac signs
  VALID_ZODIAC_SIGNS: [
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
  ] as const,
} as const;

