/**
 * Astrologer validators - Dashboard stats and related
 */

import { z } from 'zod';

const VALID_LANGUAGES = ['NEPALI', 'HINDI', 'ENGLISH'] as const;

export const getDashboardStatsQuerySchema = z.object({
  language: z.enum(VALID_LANGUAGES).optional(),
});

export const getOnlineAstrologersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});

/** Self-service profile update (jyotish app); all fields optional. */
export const astrologerSelfPatchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.union([z.string().email().max(255), z.literal('')]).optional(),
  gender: z
    .preprocess((v) => (v === '' ? null : v), z.enum(['MALE', 'FEMALE', 'OTHER']).nullable())
    .optional(),
  bio: z.string().max(5000).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
});
