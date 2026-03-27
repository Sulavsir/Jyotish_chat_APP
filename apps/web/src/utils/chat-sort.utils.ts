/**
 * Sort chat rows by most recent activity (last message time, then row update time).
 */

import type { Chat } from '@/types/chat';

function toTime(value: Date | string | null | undefined): number {
  if (value == null) return 0;
  const d = value instanceof Date ? value : new Date(value);
  const t = d.getTime();
  return Number.isNaN(t) ? 0 : t;
}

export function sortChatsByRecentActivity(chats: Chat[]): Chat[] {
  return [...chats].sort((a, b) => {
    const aPrimary = toTime(a.lastMessageAt);
    const bPrimary = toTime(b.lastMessageAt);
    if (bPrimary !== aPrimary) return bPrimary - aPrimary;
    return toTime(b.updatedAt) - toTime(a.updatedAt);
  });
}
