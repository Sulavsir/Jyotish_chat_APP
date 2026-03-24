/**
 * Client Chat History Validators
 * For astrologer-only anonymous aggregated view of client's past conversations
 */

import { z } from 'zod';

const LIMIT_MIN = 1;
const LIMIT_MAX = 50;
const LIMIT_DEFAULT = 12;

export const clientChatHistoryQuerySchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  cursor: z
    .string()
    .datetime({ message: 'Invalid cursor format (ISO 8601)' })
    .optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return LIMIT_DEFAULT;
      const n = parseInt(val, 10);
      return Number.isNaN(n) ? LIMIT_DEFAULT : Math.min(LIMIT_MAX, Math.max(LIMIT_MIN, n));
    }),
});

export const clientHasChatHistoryParamSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
});

export type ClientChatHistoryQuery = z.infer<typeof clientChatHistoryQuerySchema>;
export type ClientHasChatHistoryParams = z.infer<typeof clientHasChatHistoryParamSchema>;
