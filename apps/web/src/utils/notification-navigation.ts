/**
 * Deep-link target for a notification (bell + full notifications list).
 * Keep in sync with NotificationBell routing behavior.
 */

export interface NotificationNavInput {
  type: string;
  metadata?: Record<string, unknown> | null;
  /** When true, paths are under /jyotish */
  isAstrologer: boolean;
}

/**
 * Returns a path to navigate to, or null to stay put / only mark read.
 */
export function getNotificationDestination(input: NotificationNavInput): string | null {
  const { type, metadata, isAstrologer } = input;
  const prefix = isAstrologer ? '/jyotish' : '';
  const m = metadata ?? {};

  const chatId =
    typeof m.chatId === 'string' && m.chatId.trim() ? m.chatId.trim() : undefined;

  if (type === 'CHAT_MESSAGE' || type === 'NEW_MESSAGE') {
    if (chatId) {
      return `${prefix}/chat?chatId=${encodeURIComponent(chatId)}`;
    }
    // Instant chat request (no chat yet) or legacy rows
    return `${prefix}/chat`;
  }

  if (type === 'BROADCAST_ACCEPTED') {
    if (chatId) {
      return `${prefix}/chat?chatId=${encodeURIComponent(chatId)}`;
    }
    return `${prefix}/chat`;
  }

  if (type === 'BROADCAST_MESSAGE') {
    return `${prefix}/chat`;
  }

  if (type === 'SYSTEM' && m.event === 'SESSION_STARTED' && chatId) {
    return `${prefix}/chat?chatId=${encodeURIComponent(chatId)}`;
  }

  if (type === 'CONSULTATION_BOOKED' || type === 'CONSULTATION_REMINDER') {
    const cid = m.consultationId;
    return typeof cid === 'string' && cid
      ? `${prefix}/consultations/${encodeURIComponent(cid)}`
      : `${prefix}/consultations`;
  }

  if (type === 'PAYMENT' || type === 'PAYMENT_RECEIVED' || type === 'PAYMENT_SUCCESS') {
    if (isAstrologer) {
      return `${prefix}/notifications`;
    }
    return `${prefix}/transactions`;
  }

  return `${prefix}/notifications`;
}
