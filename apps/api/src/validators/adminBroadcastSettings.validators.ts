import { z } from 'zod';

export const updateAdminBroadcastSettingsBodySchema = z.object({
  expiryMinutes: z.number().int().min(1).max(120),
  acceptanceLimitOrdinary: z.number().int().min(0).max(100),
  acceptanceLimitProfessional: z.number().int().min(0).max(100),
});

export type UpdateAdminBroadcastSettingsBody = z.infer<
  typeof updateAdminBroadcastSettingsBodySchema
>;

export const assignPendingBroadcastBodySchema = z.object({
  astrologerId: z.string().uuid(),
});

export type AssignPendingBroadcastBody = z.infer<typeof assignPendingBroadcastBodySchema>;

