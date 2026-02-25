/**
 * Tip validators - Daily dashboard tips
 */

import { z } from 'zod';

const VALID_LANGUAGES = ['NEPALI', 'HINDI', 'ENGLISH'] as const;
const VALID_AUDIENCES = ['CLIENT', 'JYOTISH', 'BOTH'] as const;

const isoDateString = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      const d = new Date(val);
      return !isNaN(d.getTime());
    },
    { message: 'Invalid date format (use YYYY-MM-DD)' }
  );

export const getTodayTipsQuerySchema = z.object({
  language: z.enum(VALID_LANGUAGES).optional(),
  audience: z.enum(VALID_AUDIENCES).optional(),
  date: isoDateString,
});

const tipItemSchema = z.object({
  date: z
    .string()
    .min(1, 'Date is required')
    .refine((val) => !isNaN(new Date(val).getTime()), { message: 'Invalid date format' }),
  text: z.string().min(5, 'Tip must be at least 5 characters').max(500, 'Tip is too long'),
  language: z.enum(VALID_LANGUAGES, { required_error: 'Language is required' }),
  audience: z.enum(VALID_AUDIENCES, { required_error: 'Audience is required' }),
});

/** Single API: body is always { tips: [...] }. One item or many, same endpoint. */
export const createTipsBodySchema = z.object({
  tips: z.array(tipItemSchema).min(1, 'At least one tip is required').max(50, 'At most 50 tips per request'),
});

export const listTipsQuerySchema = z.object({
  language: z.enum(VALID_LANGUAGES).optional(),
  audience: z.enum(VALID_AUDIENCES).optional(),
  dateFrom: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const d = new Date(val);
        return !isNaN(d.getTime());
      },
      { message: 'Invalid dateFrom format' }
    ),
  dateTo: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const d = new Date(val);
        return !isNaN(d.getTime());
      },
      { message: 'Invalid dateTo format' }
    ),
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
});

export const updateTipBodySchema = tipItemSchema;

