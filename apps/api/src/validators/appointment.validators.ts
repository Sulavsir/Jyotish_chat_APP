/**
 * Appointment Validators
 */

import { z } from 'zod';
import { AppointmentStatus } from '@prisma/client';
import { queryPaginationSchema } from './query.validators';

const bookingTypeEnum = z.enum(['APPOINTMENT', 'KUNDALI_REVIEW']);

/**
 * Validator for creating a new appointment.
 * With slotId + bookingType: books astrologer-defined slot (direct CONFIRMED); without: legacy PENDING.
 */
export const createAppointmentSchema = z.object({
  astrologerId: z.string().uuid('Invalid astrologer ID'),
  scheduledAt: z.string().datetime('Invalid datetime format').optional(),
  duration: z
    .number()
    .int()
    .min(15, 'Duration must be at least 15 minutes')
    .max(180, 'Duration cannot exceed 180 minutes')
    .optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  slotId: z.string().uuid('Invalid slot ID').optional(),
  bookingType: bookingTypeEnum.optional(),
}).refine(
  (data) => {
    if (data.slotId != null || data.bookingType != null) {
      return data.slotId != null && data.bookingType != null;
    }
    return data.scheduledAt != null;
  },
  { message: 'Either (slotId + bookingType) or scheduledAt is required.' }
);

/**
 * Validator for updating appointment status
 */
export const updateAppointmentSchema = z.object({
  status: z.nativeEnum(AppointmentStatus).optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  rating: z.number().int().min(1).max(5).optional(),
  review: z.string().max(1000, 'Review cannot exceed 1000 characters').optional(),
  cancellationNote: z
    .string()
    .max(500, 'Cancellation note cannot exceed 500 characters')
    .optional(),
});

/**
 * Validator for checking availability
 */
export const checkAvailabilitySchema = z.object({
  astrologerId: z.string().uuid('Invalid astrologer ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

/**
 * Validator for cancelling an appointment (optional cancellation note)
 */
export const cancelAppointmentSchema = z.object({
  cancellationNote: z
    .string()
    .max(500, 'Cancellation note cannot exceed 500 characters')
    .optional(),
});

/**
 * Query validator for listing "my" appointments (client/astrologer).
 * Use status for a single status, or statuses for multiple (e.g. consultations: IN_PROGRESS,COMPLETED).
 */
export const listMyAppointmentsQuerySchema = queryPaginationSchema.extend({
  search: z.string().trim().min(1).optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  statuses: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : undefined))
    .pipe(z.array(z.nativeEnum(AppointmentStatus)).optional()),
});
