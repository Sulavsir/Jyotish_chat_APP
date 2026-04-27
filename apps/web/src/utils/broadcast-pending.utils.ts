import type { BroadcastMessage } from '@/types';
import { isBroadcastPendingInPostTimerGrace } from '@/utils/broadcastMessage.utils';

export function isMultiQuestionBatch(message: BroadcastMessage): boolean {
  const metadata = (message.metadata ?? {}) as {
    batchId?: string;
    totalInBatch?: number;
  };

  return (
    !!metadata.batchId && typeof metadata.totalInBatch === 'number' && metadata.totalInBatch > 1
  );
}

/**
 * Pick one representative pending message for UI (single broadcast or first item in a batch).
 */
export function pickPendingBroadcastMessage(messages: BroadcastMessage[]): BroadcastMessage | null {
  const active = messages.filter((m) => isBroadcastPendingInPostTimerGrace(m));
  if (active.length === 0) return null;

  const multi = active.filter(isMultiQuestionBatch);
  if (multi.length > 0) {
    const batchId = (multi[0].metadata as Record<string, unknown>)?.batchId as string;
    const batch = multi
      .filter((m) => (m.metadata as Record<string, unknown>)?.batchId === batchId)
      .sort(
        (a, b) =>
          (((a.metadata as Record<string, unknown>).batchIndex as number) ?? 0) -
          (((b.metadata as Record<string, unknown>).batchIndex as number) ?? 0)
      );
    return batch[0] ?? multi[0];
  }

  return active.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
}
