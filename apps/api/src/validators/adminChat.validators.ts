/**
 * Admin Chat Validators
 */

import { z } from 'zod';

export const createAdminChatSchema = z.object({
  initialMessage: z.string().min(1, 'Initial message is required').max(1000, 'Message too long'),
});

export const sendAdminChatMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(2000, 'Message too long'),
  type: z.enum(['TEXT', 'IMAGE', 'FILE']).optional().default('TEXT'),
});

export const updateAdminChatStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'RESOLVED', 'CLOSED']),
});

export const assignAdminToChatSchema = z.object({
  adminId: z.string().uuid('Invalid admin ID'),
});
