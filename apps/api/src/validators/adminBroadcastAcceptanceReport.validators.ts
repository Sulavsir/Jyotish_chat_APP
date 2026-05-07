/**
 * Query validation for admin astrologer chat acceptance reports
 * (Everyone Jyotish broadcast + instant / direct chat)
 */

import { z } from 'zod';
import { parseEarningsDateQueryParam } from '../utils/date-query.utils';
import type { AstrologerChatAcceptanceReportSortBy } from '@jyotish/shared';

const sortBySchema = z
  .string()
  .optional()
  .transform(
    (v): AstrologerChatAcceptanceReportSortBy => {
      if (v === 'name') return 'name';
      if (v === 'directChatAcceptedCount') return 'directChatAcceptedCount';
      if (v === 'totalAcceptances') return 'totalAcceptances';
      if (v === 'firstBroadcastAcceptedCount') return 'firstBroadcastAcceptedCount';
      /** @deprecated query param alias */
      if (v === 'freeBroadcastAcceptedCount') return 'firstBroadcastAcceptedCount';
      if (v === 'acceptedCount') return 'broadcastAcceptedCount';
      return 'broadcastAcceptedCount';
    }
  );

export const listAdminBroadcastAcceptanceReportQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 1))
      .pipe(z.number().int().min(1)),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 20))
      .pipe(z.number().int().min(1).max(100)),
    search: z
      .string()
      .optional()
      .transform((s) => (s == null || s.trim() === '' ? undefined : s.trim())),
    from: z
      .string()
      .optional()
      .transform((val) => parseEarningsDateQueryParam(val, 'start')),
    to: z
      .string()
      .optional()
      .transform((val) => parseEarningsDateQueryParam(val, 'end')),
    sortBy: sortBySchema,
    sortOrder: z
      .string()
      .optional()
      .transform((v): 'asc' | 'desc' => (v === 'asc' ? 'asc' : 'desc')),
  })
  .refine((d) => !d.from || !d.to || d.from <= d.to, {
    message: 'from must be on or before to',
    path: ['to'],
  });

export type ListAdminBroadcastAcceptanceReportQuery = z.infer<
  typeof listAdminBroadcastAcceptanceReportQuerySchema
>;
