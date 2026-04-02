/**
 * Broadcast Question Validators
 * Request validation for multi-question broadcast (prepare, send)
 */

import { z } from 'zod';

// A question item can be a real DB question (uuid id) or a custom typed question (custom:N id)
const questionItemSchema = z.object({
  id: z.string().min(1, 'Question ID is required'),
  text: z
    .string()
    .min(1, 'Question text is required')
    .max(300, 'Question text cannot exceed 300 characters'),
  isCustom: z.boolean().optional(),
});

export const prepareBroadcastQuestionsBodySchema = z
  .object({
    questionIds: z
      .array(z.string().uuid('Invalid question ID'))
      .max(40, 'Maximum 40 questions per batch')
      .default([]),
    customTexts: z
      .array(
        z
          .string()
          .min(1, 'Custom question text cannot be empty')
          .max(60, 'Question cannot exceed 60 characters')
      )
      .max(10, 'Maximum 10 custom questions per batch')
      .default([]),
  })
  .refine((data) => data.questionIds.length + data.customTexts.length >= 1, {
    message: 'Select at least one question or type a custom question',
  })
  .refine((data) => data.questionIds.length + data.customTexts.length <= 50, {
    message: 'Maximum 50 questions per batch',
  });

export const sendBroadcastQuestionsBodySchema = z.object({
  questionItems: z
    .array(questionItemSchema)
    .min(1, 'At least one question is required')
    .max(40, 'Maximum 40 questions per batch'),
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

/** Direct chat: tiered multi-question bundle (same total rules as broadcast prepare) */
export const sendDirectQuestionBundleBodySchema = z.object({
  astrologerId: z.string().min(1, 'Astrologer ID is required'),
  questionItems: z
    .array(questionItemSchema)
    .min(1, 'At least one question is required')
    .max(40, 'Maximum 40 questions per batch'),
  totalNr: z.number().int().min(0, 'Total NRs must be non-negative'),
  birthDetails: z
    .object({
      dateOfBirth: z.string().optional(),
      timeOfBirth: z.string().optional(),
      placeOfBirth: z.string().optional(),
      gender: z.string().optional(),
    })
    .optional(),
  questionCategory: z.string().optional(),
  /** Ask Questions dashboard: enforce "no other active chat" including same Jyotish pair. */
  fromDashboard: z.boolean().optional(),
});

export type PrepareBroadcastQuestionsBody = z.infer<typeof prepareBroadcastQuestionsBodySchema>;
export type SendBroadcastQuestionsBody = z.infer<typeof sendBroadcastQuestionsBodySchema>;
/** Intersection ensures `fromDashboard` is present for TS (some versions narrow z.infer oddly on optional flags). */
export type SendDirectQuestionBundleBody = z.infer<typeof sendDirectQuestionBundleBodySchema> & {
  fromDashboard?: boolean;
};
