/**
 * Socket event name constants (admin app)
 *
 * Keep these in sync with server emits in `apps/api/src/socket/*`.
 */
export const ADMIN_SOCKET_EVENTS = {
  STATS: {
    UPDATE: 'stats:update',
  },
  SIDEBAR: {
    INVALIDATE: 'sidebar:invalidate',
  },
  CHAT: {
    NEW: 'chat:new',
    UPDATE: 'chat:update',
    ENDED: 'chat:ended',
    ABANDONED: 'chat:abandoned',
    UNBLOCKED: 'chat:unblocked',
  },
  USER: {
    NEW: 'user:new',
    UPDATE: 'user:update',
    STATUS: 'user:status',
  },
  ASTROLOGER: {
    NEW: 'astrologer:new',
    UPDATE: 'astrologer:update',
    STATUS_CHANGED: 'astrologer:status_changed',
  },
  EARNING: {
    NEW: 'earning:new',
    UPDATE: 'earning:update',
  },
  AUDIT_LOG: {
    NEW: 'auditLog:new',
  },
  CONSULTATION: {
    NEW: 'consultation:new',
    UPDATE: 'consultation:update',
  },
  CHAT_AUDIT: {
    NEW: 'chatAudit:new',
    UPDATE: 'chatAudit:update',
    CHAT_ENDED: 'chatAudit:chatEnded',
  },
  BROADCAST: {
    NEW: 'broadcast:new',
    UPDATE: 'broadcast:update',
  },
  ADMIN_CHAT: {
    NEW_MESSAGE: 'admin-chat:new-message',
    MESSAGE: 'admin-chat:message',
    JOIN: 'admin-chat:join',
    JOINED: 'admin-chat:joined',
    TYPING: 'admin-chat:typing',
    ERROR: 'admin-chat:error',
    SEND: 'admin-chat:send',
  },
} as const;

