/**
 * Horoscope validation schemas
 */

import { z } from 'zod';

const VALID_ZODIAC_SIGNS = [
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

const VALID_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY'] as const;

/**
 * Zodiac sign param schema
 */
export const zodiacSignParamSchema = z.object({
  zodiacSign: z
    .string()
    .min(1, 'Zodiac sign is required')
    .toUpperCase()
    .refine((val) => VALID_ZODIAC_SIGNS.includes(val as any), {
      message: `Invalid zodiac sign. Must be one of: ${VALID_ZODIAC_SIGNS.join(', ')}`,
    }),
});

/**
 * Daily horoscope query schema
 */
export const dailyHoroscopeQuerySchema = z.object({
  date: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: 'Invalid date format' }
    ),
});

/**
 * Subscribe to horoscope schema
 */
export const subscribeHoroscopeSchema = z.object({
  frequency: z.enum(VALID_FREQUENCIES).optional(),
  deliveryTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:MM (24-hour format)')
    .optional(),
});

/**
 * Update subscription schema
 */
export const updateSubscriptionSchema = z.object({
  frequency: z.enum(VALID_FREQUENCIES).optional(),
  deliveryTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:MM (24-hour format)')
    .optional(),
});
