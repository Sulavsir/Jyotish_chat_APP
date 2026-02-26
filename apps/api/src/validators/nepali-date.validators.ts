/**
 * Nepali Date validators - date format and bulk convert body
 */

import { z } from 'zod';

const isoDateString = z
  .string()
  .min(1, 'Date is required')
  .refine(
    (val) => {
      const d = new Date(val);
      return !Number.isNaN(d.getTime());
    },
    { message: 'Invalid date format (use YYYY-MM-DD)' }
  );

export const getNepaliDateQuerySchema = z.object({
  date: isoDateString,
});

export const convertNepaliDatesBodySchema = z.object({
  dates: z
    .array(isoDateString)
    .min(1, 'At least one date is required')
    .max(100, 'At most 100 dates per request'),
});
