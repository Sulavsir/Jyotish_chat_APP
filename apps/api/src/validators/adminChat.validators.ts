/**
 * Admin Chat Validators
 */

import { z } from 'zod';

const adminListPaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
});

/** GET /api/v1/admin/chats — monitor client↔jyotish chats */
export const listAdminMonitorChatsQuerySchema = adminListPaginationSchema.extend({
  status: z.enum(['ACTIVE', 'ENDED']).optional(),
  search: z.string().optional(),
});
export type ListAdminMonitorChatsQuery = z.infer<typeof listAdminMonitorChatsQuerySchema>;

/** GET /api/v1/admin-chat/admin/all — support widget admin chats */
export const listAdminSupportChatsQuerySchema = adminListPaginationSchema.extend({
  status: z.enum(['ACTIVE', 'RESOLVED', 'CLOSED']).optional(),
  search: z.string().optional(),
});
export type ListAdminSupportChatsQuery = z.infer<typeof listAdminSupportChatsQuerySchema>;

export const createAdminChatSchema = z.object({
  initialMessage: z.string().min(1, 'Initial message is required').max(1000, 'Message too long'),
});

export const sendAdminChatMessageSchema = z.object({
  content: z
    .string()
    .max(2000, 'Message too long')
    .optional()
    .default('')
    .transform((val) => val.trim()),
  type: z.enum(['TEXT', 'IMAGE', 'FILE', 'AUDIO']).optional().default('TEXT'),
  metadata: z
    .object({
      fileUrl: z.string().min(1),
      fileName: z.string().optional(),
      mimeType: z.string().optional(),
      fileSize: z.number().optional(),
    })
    .partial()
    .optional(),
}).superRefine((data, ctx) => {
  const hasContent = data.content.length > 0;
  const hasFile = !!data.metadata?.fileUrl;
  if (!hasContent && !hasFile) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 1,
      type: 'string',
      inclusive: true,
      exact: false,
      message: 'Message content is required',
      path: ['content'],
    });
  }
});

export const updateAdminChatStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'RESOLVED', 'CLOSED']),
});

export const assignAdminToChatSchema = z.object({
  adminId: z.string().uuid('Invalid admin ID'),
});

/** Optional reason when admin abandons a chat */
export const abandonChatBodySchema = z.object({
  reason: z
    .string()
    .max(500, 'Reason cannot exceed 500 characters')
    .trim()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
});
