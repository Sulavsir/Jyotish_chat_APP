/**
 * Query Validators - Backend-specific query string validators
 */

import { z } from 'zod';

/**
 * Query string pagination validator
 */
export const queryPaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 20)),
});

/**
 * UUID param validator
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

/**
 * Chat ID param validator (for chat-specific routes)
 */
export const chatIdParamSchema = z.object({
  chatId: z.string().uuid('Invalid chat ID format'),
});

