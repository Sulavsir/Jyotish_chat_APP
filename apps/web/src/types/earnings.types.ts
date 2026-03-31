/**
 * Astrologer earnings (My Earnings). Amounts are balance in NRs; backend stores them as integer units.
 */

export type AstrologerCoinEarningSource =
  | 'CHAT_MESSAGE'
  | 'BROADCAST_MESSAGE'
  | 'APPOINTMENT'
  | 'KUNDALI_REVIEW';

export interface AstrologerCoinEarningRow {
  id: string;
  astrologerId: string;
  coinTransactionId: string | null;
  chatId: string | null;
  broadcastMessageId: string | null;
  appointmentId: string | null;
  source: AstrologerCoinEarningSource;
  /** Client balance deducted for this line (NRs) */
  clientCoinsDeducted: number;
  commissionPercent: number;
  /** Your credited balance from this line (NRs) */
  astrologerCoinsEarned: number;
  /** Questions represented by this DB row (bundle size); omit for legacy rows */
  questionCount?: number | null;
  /** e.g. "First broadcast discount" when earning is from a discounted first broadcast */
  sourceDetail?: string;
  createdAt: string;
  clientName: string | null;
}

export interface AstrologerEarningsSummary {
  /** Total balance earned (NRs); API field name is totalCoins */
  totalCoins: number;
  bySource: Record<AstrologerCoinEarningSource, number>;
  period?: { from: string; to: string };
}

export interface GetAstrologerEarningsResult {
  items: AstrologerCoinEarningRow[];
  total: number;
  summary: AstrologerEarningsSummary;
}

export interface GetAstrologerEarningsParams {
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
  source?: AstrologerCoinEarningSource;
}
