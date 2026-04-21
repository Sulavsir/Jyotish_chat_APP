/**
 * WebSocket Constants
 */

import { KUNDALI_APPOINTMENT_SOCKET_EVENT } from '@jyotish/shared';

export const WS_EVENTS = {
  // Outgoing
  CHAT_SEND: 'chat:send',
  CHAT_TYPING: 'chat:typing',
  CHAT_MARK_READ: 'chat:mark-read',
  NOTIFICATION_MARK_READ: 'notification:mark-read',

  // Incoming
  CHAT_RECEIVE: 'chat:receive',
  CHAT_SENT: 'chat:sent',
  CHAT_TYPING_INDICATOR: 'chat:typing-indicator',
  NOTIFICATION_NEW: 'notification:new',
  USER_STATUS: 'user:status',
  ASTROLOGER_STATUS_CHANGED: 'astrologer:status_changed',
  ASTROLOGER_ADMIN_STATUS_CHANGED: 'astrologer:admin_status_changed',
  ASTROLOGER_UPDATED: 'astrologer:updated',
  CONSULTATION_UPDATE: 'consultation:update',
  APPOINTMENT_SESSION_READY: KUNDALI_APPOINTMENT_SOCKET_EVENT.SESSION_READY,
} as const;

