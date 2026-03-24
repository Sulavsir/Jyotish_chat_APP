/**
 * Application Constants
 */

// API Base URL

// Status values
export const BROADCAST_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  EXPIRED: 'EXPIRED',
} as const;

export const CHAT_STATUS = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const MESSAGE_TYPE = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  FILE: 'FILE',
  AUDIO: 'AUDIO',
} as const;

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_VISIBLE_PAGES: 5,
} as const;

/** Debounce for admin date filters (ms) — avoids refetch on every keystroke */
export const ADMIN_DATE_FILTER_DEBOUNCE_MS = 400;

/** Debounce for admin list search inputs (ms) */
export const ADMIN_SEARCH_DEBOUNCE_MS = 400;

// Chat audit defaults
export const CHAT_AUDIT_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  LOAD_LIMIT: 100,
} as const;

// Table settings
export const TABLE_SETTINGS = {
  ROWS_PER_PAGE: 10,
  SKELETON_ROWS: 15,
} as const;

// Socket event names
export const SOCKET_EVENTS = {
  CHAT_AUDIT_NEW: 'chatAudit:new',
  CHAT_AUDIT_UPDATE: 'chatAudit:update',
  CHAT_AUDIT_CHAT_ENDED: 'chatAudit:chatEnded',
  AUDIT_LOG_NEW: 'auditLog:new',
  STATS_UPDATE: 'stats:update',
  CHAT_NEW: 'chat:new',
  CHAT_UPDATE: 'chat:update',
  USER_NEW: 'user:new',
  USER_UPDATE: 'user:update',
  ASTROLOGER_NEW: 'astrologer:new',
  ASTROLOGER_UPDATE: 'astrologer:update',
} as const;

// Color mappings
export const STATUS_COLORS = {
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  ACCEPTED: 'bg-green-500/20 text-green-400',
  EXPIRED: 'bg-gray-500/20 text-gray-400',
  CANCELLED: 'bg-orange-500/20 text-orange-400',
  ACTIVE: 'bg-green-500/20 text-green-400',
  COMPLETED: 'bg-blue-500/20 text-blue-400',
  ENDED: 'bg-red-500/20 text-red-400',
} as const;

export const ACTION_COLORS = {
  CREATE: 'bg-green-500/20 text-green-400',
  REGISTER: 'bg-green-500/20 text-green-400',
  UPDATE: 'bg-blue-500/20 text-blue-400',
  DELETE: 'bg-red-500/20 text-red-400',
  LOGIN: 'bg-purple-500/20 text-purple-400',
  LOGOUT: 'bg-orange-500/20 text-orange-400',
  REQUEST: 'bg-yellow-500/20 text-yellow-400',
  ACCEPT: 'bg-emerald-500/20 text-emerald-400',
  EXPIRE: 'bg-gray-500/20 text-gray-400',
  CANCEL: 'bg-gray-500/20 text-gray-400',
  DEFAULT: 'bg-slate-500/20 text-slate-400',
} as const;

// Avatar gradient colors
export const AVATAR_GRADIENTS = {
  CLIENT: 'from-purple-500 to-pink-500',
  ASTROLOGER: 'from-blue-500 to-cyan-500',
  ADMIN: 'from-cosmic-purple to-nebula-pink',
} as const;

// Filter options
export const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

export const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'BROADCAST_MESSAGE', label: 'Broadcast Message' },
  { value: 'INSTANT_CHAT_REQUEST', label: 'Instant Chat Request' },
] as const;

/** Copy for delete confirmation dialogs (soft delete) */
export const DELETE_CONFIRM = {
  ASTROLOGER: {
    TITLE: 'Delete astrologer',
    DESCRIPTION:
      'This will deactivate the astrologer. They will be removed from the active list and cannot log in until reactivated.',
    CONFIRM_TEXT: 'Delete',
    SUCCESS: 'Astrologer deleted successfully',
    ERROR: 'Failed to delete astrologer',
  },
} as const;

/** Copy for astrologer edit/delete password prompt */
export const ASTROLOGER_EDIT_PASSWORD = {
  MODAL_TITLE: 'Password required',
  MODAL_DESCRIPTION: 'For this action a password is required. Please enter it below.',
  PASSWORD_PLACEHOLDER: 'Enter password',
  CANCEL: 'Cancel',
  SUBMIT: 'Submit',
  CONTINUE_TO_EDIT: 'Continue to Edit',
  INVALID_PASSWORD: 'Invalid password',
  /** sessionStorage key for passing verified password to edit page (cleared after use) */
  STORAGE_KEY: 'astrologer_edit_password',
} as const;
