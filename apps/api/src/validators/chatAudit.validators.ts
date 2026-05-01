/**
 * Admin chat audit list query
 */

import { z } from 'zod';

const emptyToUndefined = (v: unknown) =>
  v === '' || v === undefined || v === null ? undefined : v;

const numQuery = (fallback: number, max?: number) =>
  z.preprocess((v) => {
    if (v === undefined || v === '' || v === null) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }, max != null ? z.number().int().min(1).max(max) : z.number().int().min(1));

export const listChatAuditQuerySchema = z.object({
  page: numQuery(1),
  limit: numQuery(10, 100),
  status: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  search: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  type: z.preprocess(
    emptyToUndefined,
    z.enum(['BROADCAST_MESSAGE', 'INSTANT_CHAT_REQUEST']).optional()
  ),
  astrologerId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
});

export type ListChatAuditQuery = z.infer<typeof listChatAuditQuerySchema>;
