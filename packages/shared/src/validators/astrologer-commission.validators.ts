import { z } from 'zod';
import { DEFAULT_ASTROLOGER_COMMISSION_PERCENT } from '../constants/astrologer-commission.constants';

export const commissionPercentFieldSchema = z
  .number({ invalid_type_error: 'Commission must be a number' })
  .min(0, 'Commission cannot be negative')
  .max(100, 'Commission cannot exceed 100%');

/**
 * Per-source astrologer commission % (coins the Jyotish earns from client deductions).
 * All optional in PATCH/approve; server applies defaults when omitted.
 */
export const astrologerCommissionFieldsSchema = z.object({
  chatMessageCommissionPercent: commissionPercentFieldSchema.optional(),
  broadcastMessageCommissionPercent: commissionPercentFieldSchema.optional(),
  firstBroadcastCommissionPercent: commissionPercentFieldSchema.optional(),
  kundaliReviewCommissionPercent: commissionPercentFieldSchema.optional(),
  appointmentCommissionPercent: commissionPercentFieldSchema.optional(),
});

export type AstrologerCommissionFieldsInput = z.infer<typeof astrologerCommissionFieldsSchema>;

export function defaultAstrologerCommissionFields(): {
  chatMessageCommissionPercent: number;
  broadcastMessageCommissionPercent: number;
  firstBroadcastCommissionPercent: number;
  kundaliReviewCommissionPercent: number;
  appointmentCommissionPercent: number;
} {
  const d = DEFAULT_ASTROLOGER_COMMISSION_PERCENT;
  return {
    chatMessageCommissionPercent: d,
    broadcastMessageCommissionPercent: d,
    firstBroadcastCommissionPercent: d,
    kundaliReviewCommissionPercent: d,
    appointmentCommissionPercent: d,
  };
}
