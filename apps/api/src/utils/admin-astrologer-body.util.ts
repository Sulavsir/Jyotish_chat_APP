import { DEFAULT_ASTROLOGER_COMMISSION_PERCENT } from '@jyotish/shared';

function parseOptionalPercent(body: Record<string, unknown>, key: string): number | undefined {
  const v = body[key];
  if (v === undefined || v === null || v === '') return undefined;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Multipart / JSON body: optional per-source commission %. Missing keys use platform default (10).
 */
export function parseAstrologerCommissionFieldsFromBody(body: Record<string, unknown>): {
  chatMessageCommissionPercent: number;
  broadcastMessageCommissionPercent: number;
  firstBroadcastCommissionPercent: number;
  kundaliReviewCommissionPercent: number;
  appointmentCommissionPercent: number;
} {
  const d = DEFAULT_ASTROLOGER_COMMISSION_PERCENT;
  return {
    chatMessageCommissionPercent:
      parseOptionalPercent(body, 'chatMessageCommissionPercent') ?? d,
    broadcastMessageCommissionPercent:
      parseOptionalPercent(body, 'broadcastMessageCommissionPercent') ?? d,
    firstBroadcastCommissionPercent:
      parseOptionalPercent(body, 'firstBroadcastCommissionPercent') ?? d,
    kundaliReviewCommissionPercent:
      parseOptionalPercent(body, 'kundaliReviewCommissionPercent') ?? d,
    appointmentCommissionPercent:
      parseOptionalPercent(body, 'appointmentCommissionPercent') ?? d,
  };
}
