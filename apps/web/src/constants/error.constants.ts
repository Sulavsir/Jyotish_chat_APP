/**
 * Error Code Constants
 * Centralized error codes used across the application
 */

export const ERROR_CODES = {
  INSUFFICIENT_COINS: 'INSUFFICIENT_COINS',
  APPOINTMENT_REQUIRED: 'APPOINTMENT_REQUIRED',
  APPOINTMENT_WINDOW_EXPIRED: 'APPOINTMENT_WINDOW_EXPIRED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
