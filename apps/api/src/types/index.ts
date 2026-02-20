/**
 * Types - Barrel Export
 */

// Re-export shared types
export * from '@jyotish/shared';

// Export module-specific types
export * from './auth.types';
export * from './user.types';
export * from './otp.types';
export * from './consultation.types';
export * from './horoscope.types';
export * from './notification.types';
export * from './database.types';
export * from './service.types';
export * from './common.types';
export * from './sms.types';
// Re-export appointment types but exclude AstrologerCategory to avoid conflict with @jyotish/shared
export type {
  AppointmentStatus,
  BookAppointmentData,
  UpdateAppointmentData,
  AppointmentEntity,
  AppointmentWithRelations,
  CheckAvailabilityQuery,
  TimeSlot,
} from './appointment.types';
