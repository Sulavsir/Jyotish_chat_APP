/**
 * Astrologer validators - Dashboard stats and related
 */

import { z } from 'zod';

const VALID_LANGUAGES = ['NEPALI', 'HINDI', 'ENGLISH'] as const;

export const getDashboardStatsQuerySchema = z.object({
  language: z.enum(VALID_LANGUAGES).optional(),
});
