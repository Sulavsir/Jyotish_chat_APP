import { z } from 'zod';

const MAX_KUNDALI_MATCH_CONSULTATION_TOPICS = 40;

/**
 * Client-selected consultation topic IDs (from public catalogue; validated for shape only).
 * Existence + active state are enforced in the API against the database.
 */
export const kundaliMatchConsultationQuestionIdsSchema = z
  .array(z.string().trim().min(1).max(128))
  .min(1, 'Select at least one consultation topic')
  .max(
    MAX_KUNDALI_MATCH_CONSULTATION_TOPICS,
    `You can select at most ${MAX_KUNDALI_MATCH_CONSULTATION_TOPICS} topics`
  )
  .refine((ids) => new Set(ids).size === ids.length, {
    message: 'Each consultation topic may only be selected once',
  });

export type KundaliMatchConsultationQuestionIdsInput = z.infer<
  typeof kundaliMatchConsultationQuestionIdsSchema
>;

/** @deprecated Use kundaliMatchConsultationQuestionIdsSchema */
export const kundaliMatchPremiumConsultationQuestionIdsSchema =
  kundaliMatchConsultationQuestionIdsSchema;

export type KundaliMatchPremiumConsultationQuestionIdsInput = KundaliMatchConsultationQuestionIdsInput;
