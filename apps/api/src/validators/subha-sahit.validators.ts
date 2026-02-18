/**
 * Subha Sahit validators - Auspicious dates for Pandit Ji bookings
 */

import { z } from 'zod';

const isoDateString = z
  .string()
  .refine(
    (val) => {
      const d = new Date(val);
      return !isNaN(d.getTime());
    },
    { message: 'Invalid date format (use YYYY-MM-DD)' }
  );

const subhaSahitItemSchema = z.object({
  date: isoDateString,
  occasion: z.string().min(1, 'Occasion is required').max(100, 'Occasion is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
});

/** Bulk create: body is { dates: [...] }. One item or many, same endpoint. */
export const createSubhaSahitDatesBodySchema = z.object({
  dates: z
    .array(subhaSahitItemSchema)
    .min(1, 'At least one date is required')
    .max(100, 'At most 100 dates per request'),
});

export const listSubhaSahitDatesQuerySchema = z.object({
  occasion: z.string().optional(),
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

export const updateSubhaSahitDateBodySchema = z.object({
  date: isoDateString.optional(),
  occasion: z.string().min(1, 'Occasion is required').max(100, 'Occasion is too long').optional(),
  description: z.string().max(500, 'Description is too long').optional().nullable(),
  isActive: z.boolean().optional(),
});

export const getAvailableDatesQuerySchema = z.object({
  occasion: z.string().optional(),
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
});
