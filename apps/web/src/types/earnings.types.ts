/**
 * Astrologer coin earnings (My Earnings) API types
 */

export type AstrologerCoinEarningSource = 'CHAT_MESSAGE' | 'BROADCAST_MESSAGE' | 'APPOINTMENT';

export interface AstrologerCoinEarningRow {
  id: string;
  astrologerId: string;
  coinTransactionId: string | null;
  chatId: string | null;
  broadcastMessageId: string | null;
  appointmentId: string | null;
  source: AstrologerCoinEarningSource;
  clientCoinsDeducted: number;
  commissionPercent: number;
  astrologerCoinsEarned: number;
  createdAt: string;
}

export interface AstrologerEarningsSummary {
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
