/**
 * Kundali Match Validators
 * Place of birth: structured (Nepal = province, district, place; Outside = single string).
 */

import { z } from 'zod';
import { optionalYmdQuery, queryPaginationSchema } from './query.validators';
import { KundaliMatchStatus } from '@prisma/client';
import { kundaliMatchPremiumConsultationQuestionIdsSchema } from '@jyotish/shared';

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
const timeOfBirthSchema = z
  .string()
  .min(1, 'Time of birth is required')
  .max(20, 'Time of birth too long');

const placeOfBirthTypeSchema = z.enum(['NEPAL', 'OUTSIDE_NEPAL']);
const uuidOptional = z.string().uuid().optional().nullable();
const locationString = z.string().max(200).optional().nullable();

export const createKundaliMatchRequestSchema = z
  .object({
    boyDateOfBirth: dateOnlySchema,
    boyTimeOfBirth: timeOfBirthSchema,
    // Optional so older clients can omit it and just send boyPlaceOfBirth string
    boyPlaceOfBirthType: z.preprocess(
      (v) => (v === '' || v === null ? undefined : v),
      placeOfBirthTypeSchema.optional().nullable()
    ),
    boyPlaceOfBirthPradeshId: z.preprocess((v) => (v === '' ? null : v), uuidOptional),
    boyPlaceOfBirthDistrictId: z.preprocess((v) => (v === '' ? null : v), uuidOptional),
    boyPlaceOfBirthLocation: z.preprocess((v) => (v === '' ? null : v), locationString),
    boyPlaceOfBirth: z.string().max(500).optional().nullable(),
    girlDateOfBirth: dateOnlySchema,
    girlTimeOfBirth: timeOfBirthSchema,
    girlPlaceOfBirthType: z.preprocess(
      (v) => (v === '' || v === null ? undefined : v),
      placeOfBirthTypeSchema.optional().nullable()
    ),
    girlPlaceOfBirthPradeshId: z.preprocess((v) => (v === '' ? null : v), uuidOptional),
    girlPlaceOfBirthDistrictId: z.preprocess((v) => (v === '' ? null : v), uuidOptional),
    girlPlaceOfBirthLocation: z.preprocess((v) => (v === '' ? null : v), locationString),
    girlPlaceOfBirth: z.string().max(500).optional().nullable(),
    consultationQuestionIds: kundaliMatchPremiumConsultationQuestionIdsSchema,
  })
  .superRefine((data, ctx) => {
    if (data.boyPlaceOfBirthType === 'NEPAL') {
      if (!data.boyPlaceOfBirthPradeshId) ctx.addIssue({ code: 'custom', message: 'Boy province is required', path: ['boyPlaceOfBirthPradeshId'] });
      if (!data.boyPlaceOfBirthDistrictId) ctx.addIssue({ code: 'custom', message: 'Boy district is required', path: ['boyPlaceOfBirthDistrictId'] });
      if (!data.boyPlaceOfBirthLocation?.trim()) ctx.addIssue({ code: 'custom', message: 'Boy place/location is required', path: ['boyPlaceOfBirthLocation'] });
    } else {
      if (!data.boyPlaceOfBirth?.trim()) ctx.addIssue({ code: 'custom', message: 'Boy place of birth is required', path: ['boyPlaceOfBirth'] });
    }
    if (data.girlPlaceOfBirthType === 'NEPAL') {
      if (!data.girlPlaceOfBirthPradeshId) ctx.addIssue({ code: 'custom', message: 'Girl province is required', path: ['girlPlaceOfBirthPradeshId'] });
      if (!data.girlPlaceOfBirthDistrictId) ctx.addIssue({ code: 'custom', message: 'Girl district is required', path: ['girlPlaceOfBirthDistrictId'] });
      if (!data.girlPlaceOfBirthLocation?.trim()) ctx.addIssue({ code: 'custom', message: 'Girl place/location is required', path: ['girlPlaceOfBirthLocation'] });
    } else {
      if (!data.girlPlaceOfBirth?.trim()) ctx.addIssue({ code: 'custom', message: 'Girl place of birth is required', path: ['girlPlaceOfBirth'] });
    }
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
  dateFrom: optionalYmdQuery,
  dateTo: optionalYmdQuery,
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
  dateFrom: optionalYmdQuery,
  dateTo: optionalYmdQuery,
});
