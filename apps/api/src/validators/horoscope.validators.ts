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

const VALID_HOROSCOPE_CATEGORIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const;

const optionalDateSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid date format (use ISO date string)' }
  );

/**
 * Zodiac sign param schema
 */
export const zodiacSignParamSchema = z.object({
  zodiacSign: z
    .string()
    .min(1, 'Zodiac sign is required')
    .toUpperCase()
    .refine((val) => VALID_ZODIAC_SIGNS.includes(val as (typeof VALID_ZODIAC_SIGNS)[number]), {
      message: `Invalid zodiac sign. Must be one of: ${VALID_ZODIAC_SIGNS.join(', ')}`,
    }),
});

/**
 * Daily horoscope query schema
 */
export const dailyHoroscopeQuerySchema = z.object({
  date: optionalDateSchema,
});

/**
 * Weekly / Monthly / Yearly horoscope query schema (optional date)
 */
export const periodHoroscopeQuerySchema = z.object({
  date: optionalDateSchema,
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

// ==================== Admin Horoscope CRUD ====================

/**
 * Create horoscope body schema (admin)
 */
export const createHoroscopeBodySchema = z.object({
  zodiacSign: z
    .string()
    .min(1, 'Zodiac sign is required')
    .toUpperCase()
    .refine((val) => VALID_ZODIAC_SIGNS.includes(val as (typeof VALID_ZODIAC_SIGNS)[number]), {
      message: `Invalid zodiac sign. Must be one of: ${VALID_ZODIAC_SIGNS.join(', ')}`,
    }),
  category: z
    .string()
    .min(1, 'Category is required')
    .refine((val) => VALID_HOROSCOPE_CATEGORIES.includes(val as (typeof VALID_HOROSCOPE_CATEGORIES)[number]), {
      message: 'Category must be DAILY, WEEKLY, MONTHLY, or YEARLY',
    }),
  date: z
    .string()
    .min(1, 'Date is required')
    .refine((val) => !isNaN(new Date(val).getTime()), { message: 'Invalid date format' }),
  content: z.string().min(1, 'Content is required').max(50000, 'Content too long'),
});

/**
 * Update horoscope body schema (admin, partial)
 */
export const updateHoroscopeBodySchema = z.object({
  zodiacSign: z
    .string()
    .min(1)
    .toUpperCase()
    .refine((val) => VALID_ZODIAC_SIGNS.includes(val as (typeof VALID_ZODIAC_SIGNS)[number]))
    .optional(),
  category: z.enum(VALID_HOROSCOPE_CATEGORIES).optional(),
  date: z.string().refine((val) => !isNaN(new Date(val).getTime())).optional(),
  content: z.string().min(1).max(50000).optional(),
});

/**
 * List horoscopes query schema (admin)
 */
export const listHoroscopesQuerySchema = z.object({
  category: z.enum(VALID_HOROSCOPE_CATEGORIES, {
    required_error: 'Category is required',
    invalid_type_error: 'Category must be DAILY, WEEKLY, MONTHLY, or YEARLY',
  }),
  zodiacSign: z
    .string()
    .toUpperCase()
    .refine((val) => !val || VALID_ZODIAC_SIGNS.includes(val as (typeof VALID_ZODIAC_SIGNS)[number]))
    .optional(),
  dateFrom: optionalDateSchema,
  dateTo: optionalDateSchema,
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
});
