/**
 * Stack astrologer coin earning rows for "My Earnings" display:
 * - Rows with the same client coin transaction (e.g. one direct bundle payment) stay one line.
 * - Broadcast credits (no coinTransactionId) from the same second + client + chat merge into one line.
 */
import type {
  AstrologerCoinEarningRow,
  AstrologerCoinEarningSource,
} from '@/types/earnings.types';

export interface StackedAstrologerEarningRow {
  /** Stable id for React keys */
  id: string;
  displayCreatedAt: string;
  source: AstrologerCoinEarningSource;
  clientName: string | null;
  astrologerCoinsEarned: number;
  /** Total questions (or messages) represented by this stacked line */
  questionCount: number;
  sourceDetail?: string;
}

function stackKey(row: AstrologerCoinEarningRow): string {
  if (row.source === 'APPOINTMENT' || row.source === 'KUNDALI_REVIEW') {
    return `solo:${row.id}`;
  }
  if (row.coinTransactionId) {
    return `tx:${row.coinTransactionId}`;
  }
  const t = new Date(row.createdAt);
  const sec = Math.floor(t.getTime() / 1000);
  return `stack:${sec}|${row.clientName ?? ''}|${row.source}|${row.chatId ?? ''}`;
}

function rowQuestionUnits(row: AstrologerCoinEarningRow): number {
  return row.questionCount != null && row.questionCount > 0 ? row.questionCount : 1;
}

export function stackAstrologerEarningsRows(rows: AstrologerCoinEarningRow[]): StackedAstrologerEarningRow[] {
  const buckets = new Map<string, AstrologerCoinEarningRow[]>();
  for (const row of rows) {
    const key = stackKey(row);
    const list = buckets.get(key) ?? [];
    list.push(row);
    buckets.set(key, list);
  }

  const out: StackedAstrologerEarningRow[] = [];
  for (const [, group] of buckets) {
    const sorted = [...group].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const first = sorted[0];
    const totalAstrologer = sorted.reduce((s, r) => s + r.astrologerCoinsEarned, 0);
    const questionCount = sorted.reduce((s, r) => s + rowQuestionUnits(r), 0);
    const displayCreatedAt = sorted.reduce(
      (latest, r) =>
        new Date(r.createdAt).getTime() > new Date(latest).getTime() ? r.createdAt : latest,
      first.createdAt
    );
    const sourceDetail = sorted.find((r) => r.sourceDetail)?.sourceDetail;
    const id = sorted
      .map((r) => r.id)
      .sort()
      .join('|');

    out.push({
      id,
      displayCreatedAt,
      source: first.source,
      clientName: first.clientName,
      astrologerCoinsEarned: totalAstrologer,
      questionCount,
      ...(sourceDetail ? { sourceDetail } : {}),
    });
  }

  return out.sort(
    (a, b) => new Date(b.displayCreatedAt).getTime() - new Date(a.displayCreatedAt).getTime()
  );
}

export function formatYouEarnedLine(
  source: AstrologerCoinEarningSource,
  astrologerCoinsEarned: number,
  questionCount: number
): string {
  if (source === 'CHAT_MESSAGE') {
    return `+ NRs ${astrologerCoinsEarned} (${questionCount} DirectQN)`;
  }
  if (source === 'BROADCAST_MESSAGE') {
    return `+ NRs ${astrologerCoinsEarned} (${questionCount} BroadcastQN)`;
  }
  return `+ NRs ${astrologerCoinsEarned}`;
}
