/**
 * Broadcast Message Validators
 * Request validation for broadcast message routes
 */

import { z } from 'zod';

/**
 * Params validator for messageId (e.g. cancel, accept, dismiss)
 */
export const messageIdParamSchema = z.object({
  messageId: z.string().uuid('Invalid message ID format'),
});

/**
 * Body validator for creating a single broadcast message (POST /)
 */
export const createBroadcastMessageBodySchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(60, 'Message cannot exceed 60 characters'),
  type: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  birthDetails: z
    .object({
      dateOfBirth: z.string().optional(),
      timeOfBirth: z.string().optional(),
      placeOfBirth: z.string().optional(),
      gender: z.string().optional(),
    })
    .optional(),
});
