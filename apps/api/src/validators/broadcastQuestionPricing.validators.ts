/**
 * Admin validators for broadcast question pricing
 */

import { z } from 'zod';

export const broadcastQuestionPricingTierSchema = z.object({
  questionCount: z.number().int().min(1).max(50),
  amountNr: z.number().int().min(0),
});

export const updateBroadcastQuestionPricingBodySchema = z.object({
  tiers: z
    .array(broadcastQuestionPricingTierSchema)
    .min(1, 'At least one tier is required')
    .max(50),
});

export type UpdateBroadcastQuestionPricingBody = z.infer<
  typeof updateBroadcastQuestionPricingBodySchema
>;
