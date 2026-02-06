import { AstrologerCategory } from '../types';

/**
 * Whether this astrologer category can accept and manage appointments.
 * Must match API (appointment.service) — only ORDINARY is rejected.
 */
export function canAcceptAppointments(category: AstrologerCategory | string): boolean {
  return category !== AstrologerCategory.ORDINARY;
}

/**
 * Whether this astrologer category can accept broadcast messages and instant chat.
 * PREMIUM is appointments-only; ORDINARY and PROFESSIONAL can accept.
 * Must match API (broadcastMessage.service, instantChat.service).
 */
export function canAcceptBroadcastMessages(category: AstrologerCategory | string): boolean {
  return category !== AstrologerCategory.PREMIUM;
}
