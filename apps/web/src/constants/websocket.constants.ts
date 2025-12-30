/**
 * WebSocket Constants
 */

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
  CONSULTATION_UPDATE: 'consultation:update',
} as const;

