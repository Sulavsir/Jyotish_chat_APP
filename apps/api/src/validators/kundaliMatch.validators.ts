/**
 * Kundali Match Validators
 */

import { z } from 'zod';
import { queryPaginationSchema } from './query.validators';
import { KundaliMatchStatus } from '@prisma/client';

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
const timeOfBirthSchema = z
  .string()
  .min(1, 'Time of birth is required')
  .max(20, 'Time of birth too long');
const placeOfBirthSchema = z
  .string()
  .min(1, 'Place of birth is required')
  .max(500, 'Place of birth too long');

export const createKundaliMatchRequestSchema = z.object({
  boyDateOfBirth: dateOnlySchema,
  boyTimeOfBirth: timeOfBirthSchema,
  boyPlaceOfBirth: placeOfBirthSchema,
  girlDateOfBirth: dateOnlySchema,
  girlTimeOfBirth: timeOfBirthSchema,
  girlPlaceOfBirth: placeOfBirthSchema,
});

export const submitKundaliMatchReviewSchema = z.object({
  adminReviewMessage: z
    .string()
    .min(10, 'Review message must be at least 10 characters')
    .max(20000, 'Review message must not exceed 20000 characters'),
});

export const listMyKundaliMatchQuerySchema = queryPaginationSchema.extend({
  status: z
    .string()
    .optional()
    .transform((val) =>
      val === KundaliMatchStatus.PENDING || val === KundaliMatchStatus.REVIEWED
        ? (val as KundaliMatchStatus)
        : undefined
    ),
});

export const listAdminKundaliMatchQuerySchema = queryPaginationSchema.extend({
  status: z
    .string()
    .optional()
    .transform((val) =>
      val === KundaliMatchStatus.PENDING || val === KundaliMatchStatus.REVIEWED
        ? (val as KundaliMatchStatus)
        : undefined
    ),
});
