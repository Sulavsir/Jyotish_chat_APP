/**
 * Appointment Validators
 */

import { z } from 'zod';
import { AppointmentStatus } from '../types/appointment.types';

/**
 * Validator for creating a new appointment
 */
export const createAppointmentSchema = z.object({
  astrologerId: z.string().uuid('Invalid astrologer ID'),
  scheduledAt: z.string().datetime('Invalid datetime format'),
  duration: z.number().int().min(15, 'Duration must be at least 15 minutes').max(180, 'Duration cannot exceed 180 minutes').default(30),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

/**
 * Validator for updating appointment status
 */
export const updateAppointmentSchema = z.object({
  status: z.nativeEnum(AppointmentStatus).optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  rating: z.number().int().min(1).max(5).optional(),
  review: z.string().max(1000, 'Review cannot exceed 1000 characters').optional(),
  cancellationNote: z.string().max(500, 'Cancellation note cannot exceed 500 characters').optional(),
});

/**
 * Validator for checking availability
 */
export const checkAvailabilitySchema = z.object({
  astrologerId: z.string().uuid('Invalid astrologer ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});



