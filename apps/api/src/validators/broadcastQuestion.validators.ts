/**
 * Broadcast Question Validators
 * Request validation for multi-question broadcast (prepare, send)
 */

import { z } from 'zod';

const questionItemSchema = z.object({
  id: z.string().uuid('Invalid question ID'),
  text: z.string().min(1, 'Question text is required').max(2000),
});

export const prepareBroadcastQuestionsBodySchema = z.object({
  questionIds: z
    .array(z.string().uuid('Invalid question ID'))
    .min(1, 'Select at least one question')
    .max(50, 'Maximum 50 questions per batch'),
});

export const sendBroadcastQuestionsBodySchema = z.object({
  questionItems: z
    .array(questionItemSchema)
    .min(1, 'At least one question is required')
    .max(50, 'Maximum 50 questions per batch'),
  totalNr: z.number().int().min(0, 'Total NRs must be non-negative'),
  birthDetails: z
    .object({
      dateOfBirth: z.string().optional(),
      timeOfBirth: z.string().optional(),
      placeOfBirth: z.string().optional(),
      gender: z.string().optional(),
    })
    .optional(),
});

export type PrepareBroadcastQuestionsBody = z.infer<typeof prepareBroadcastQuestionsBodySchema>;
export type SendBroadcastQuestionsBody = z.infer<typeof sendBroadcastQuestionsBodySchema>;
