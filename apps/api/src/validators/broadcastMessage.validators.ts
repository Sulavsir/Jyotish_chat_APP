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
