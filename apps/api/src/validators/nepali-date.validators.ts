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

/** Nepali date string (BS): YYYY-MM-DD e.g. 2080-04-06 */
const nepaliDateString = z
  .string()
  .min(1, 'Nepali date is required')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Nepali date must be YYYY-MM-DD');

export const getNepaliDateQuerySchema = z.object({
  date: isoDateString,
});

export const getEnglishDateQuerySchema = z.object({
  nepaliDate: nepaliDateString,
});

export type GetNepaliDateQuery = z.infer<typeof getNepaliDateQuerySchema>;
export type GetEnglishDateQuery = z.infer<typeof getEnglishDateQuerySchema>;

export const convertNepaliDatesBodySchema = z
  .object({
    dates: z.array(isoDateString).max(100).optional(),
    nepaliDates: z.array(nepaliDateString).max(100).optional(),
  })
  .refine((data) => (data.dates?.length ?? 0) > 0 || (data.nepaliDates?.length ?? 0) > 0, {
    message: 'Provide at least one of dates (English) or nepaliDates (Nepali BS)',
    path: ['dates'],
  });

export type ConvertNepaliDatesBody = z.infer<typeof convertNepaliDatesBodySchema>;

const yearQuery = z.coerce.number().int().min(1944).max(2030);
const monthQuery = z.coerce.number().int().min(1).max(12);
const bsYearQuery = z.coerce.number().int().min(1970).max(2090);

/** GET /nepali-date/ad-month?year=2026&month=3 - English calendar month */
export const adMonthQuerySchema = z.object({
  year: yearQuery,
  month: monthQuery,
});

/** GET /nepali-date/bs-month?year=2080&month=11 - Bikram Sambat month */
export const bsMonthQuerySchema = z.object({
  year: bsYearQuery,
  month: monthQuery,
});

export type AdMonthQuery = z.infer<typeof adMonthQuerySchema>;
export type BsMonthQuery = z.infer<typeof bsMonthQuerySchema>;
