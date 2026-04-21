import { z } from 'zod';
import { KUNDALI_MATCH_PREMIUM_QUESTION_IDS } from '../constants/kundali-match-premium-questions.constants';

const premiumIdsTuple = KUNDALI_MATCH_PREMIUM_QUESTION_IDS as unknown as [
  string,
  ...string[],
];

export const kundaliMatchPremiumQuestionIdSchema = z.enum(premiumIdsTuple);

export const kundaliMatchPremiumConsultationQuestionIdsSchema = z
  .array(kundaliMatchPremiumQuestionIdSchema)
  .min(1, 'Select at least one consultation topic')
  .max(KUNDALI_MATCH_PREMIUM_QUESTION_IDS.length)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: 'Each consultation topic may only be selected once',
  });

export type KundaliMatchPremiumConsultationQuestionIdsInput = z.infer<
  typeof kundaliMatchPremiumConsultationQuestionIdsSchema
>;
