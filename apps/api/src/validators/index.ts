/**
 * Request Validators
 * Centralized validation schemas
 */

// Re-export validators from shared package
export {
  userRegisterSchema,
  userLoginSchema,
  birthDetailsSchema,
  sendMessageSchema,
  getChatHistorySchema,
  createConsultationSchema,
  updateConsultationSchema,
  createHoroscopeSchema,
  getHoroscopeSchema,
  createNotificationSchema,
  createPaymentSchema,
  paginationSchema,
  idParamSchema,
} from '@jyotish/shared';

import { z } from 'zod';

// Additional backend-specific validators

/**
 * Query string pagination validator
 */
export const queryPaginationSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 20)),
});

/**
 * UUID param validator
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

