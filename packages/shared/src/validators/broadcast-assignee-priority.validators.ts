import { z } from 'zod';

export const createBroadcastAssigneePriorityBodySchema = z.object({
  astrologerId: z.string().uuid('Invalid astrologer id'),
  /** Lower values are tried first when auto-assigning after the broadcast timer (e.g. 1 before 10). */
  priority: z
    .number()
    .int()
    .min(-2_147_483_648)
    .max(2_147_483_647),
});

export type CreateBroadcastAssigneePriorityBody = z.infer<
  typeof createBroadcastAssigneePriorityBodySchema
>;

export const updateBroadcastAssigneePriorityBodySchema = z
  .object({
    astrologerId: z.string().uuid('Invalid astrologer id').optional(),
    priority: z
      .number()
      .int()
      .min(-2_147_483_648)
      .max(2_147_483_647)
      .optional(),
  })
  .refine((data) => data.astrologerId !== undefined || data.priority !== undefined, {
    message: 'Provide priority and/or astrologerId to update',
    path: ['priority'],
  });

export type UpdateBroadcastAssigneePriorityBody = z.infer<
  typeof updateBroadcastAssigneePriorityBodySchema
>;
