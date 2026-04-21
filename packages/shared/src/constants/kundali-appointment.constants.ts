/**
 * Full Kundali Review appointment — socket events and notification metadata.event values.
 */

export const KUNDALI_APPOINTMENT_SOCKET_EVENT = {
  SESSION_READY: 'appointment:sessionReady',
} as const;

export const KUNDALI_APPOINTMENT_NOTIFICATION_EVENT = {
  /** In-app + optional email: ~1 hour before scheduled slot */
  REMINDER_1H: 'KUNDALI_REMINDER_1H',
  /** Chat opened at scheduled time — navigate to chat */
  SESSION_READY: 'KUNDALI_SESSION_READY',
} as const;

/** groupKey prefixes (suffix with appointment id) */
export const KUNDALI_APPOINTMENT_GROUP_KEY = {
  REMINDER_1H_CLIENT: (appointmentId: string) => `kundali_reminder_1h:${appointmentId}`,
  REMINDER_1H_JYOTISH: (appointmentId: string) => `kundali_reminder_1h_jyotish:${appointmentId}`,
  SESSION_READY: (appointmentId: string) => `kundali_session_ready:${appointmentId}`,
} as const;
