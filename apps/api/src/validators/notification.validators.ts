/**
 * Notification validation schemas
 */

import { z } from 'zod';

/**
 * Get notifications query schema
 */
export const getNotificationsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (val > 0 && val <= 100), {
      message: 'Limit must be between 1 and 100',
    }),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || val >= 0, {
      message: 'Offset must be a positive number',
    }),
  unreadOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

/**
 * UUID param schema for notification ID
 */
export const notificationIdParamSchema = z.object({
  id: z.string().uuid('Invalid notification ID format'),
});

