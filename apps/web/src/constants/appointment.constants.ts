/**
 * Appointment Constants
 */

export const APPOINTMENT_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;

export const ASTROLOGER_CATEGORY = {
  ORDINARY: 'ORDINARY',
  PROFESSIONAL: 'PROFESSIONAL',
  PREMIUM: 'PREMIUM',
} as const;

export const ASTROLOGER_CATEGORY_LABELS = {
  ORDINARY: 'Ordinary',
  PROFESSIONAL: 'Professional',
  PREMIUM: 'Premium',
} as const;

export const ASTROLOGER_CATEGORY_DESCRIPTIONS = {
  ORDINARY: 'Available for instant chat only',
  PROFESSIONAL: 'Available for instant chat and appointments',
  PREMIUM: 'Available for appointments only',
} as const;

export const APPOINTMENT_STATUS_LABELS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
} as const;

export const APPOINTMENT_STATUS_COLORS = {
  PENDING: 'yellow',
  CONFIRMED: 'blue',
  IN_PROGRESS: 'purple',
  COMPLETED: 'green',
  CANCELLED: 'red',
  NO_SHOW: 'gray',
} as const;

// Default duration in minutes
export const DEFAULT_APPOINTMENT_DURATION = 30;

// Appointment time slots (9 AM to 9 PM)
export const APPOINTMENT_START_HOUR = 9;
export const APPOINTMENT_END_HOUR = 21;
export const APPOINTMENT_SLOT_INTERVAL = 30; // minutes



