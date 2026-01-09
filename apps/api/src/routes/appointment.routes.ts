/**
 * Appointment Routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { asyncHandler } from '../utils';
import * as appointmentController from '../controllers/appointmentController';
import { createAppointmentSchema, updateAppointmentSchema, checkAvailabilitySchema } from '../validators';

const router = Router();

// Create appointment
router.post(
  '/',
  authenticate,
  validateBody(createAppointmentSchema),
  asyncHandler(appointmentController.createAppointment)
);

// Get user's appointments
router.get('/my', authenticate, asyncHandler(appointmentController.getMyAppointments));

// Check availability for an astrologer
router.get(
  '/availability/:astrologerId',
  authenticate,
  validateQuery(checkAvailabilitySchema.omit({ astrologerId: true })),
  asyncHandler(appointmentController.checkAvailability)
);

// Get appointment by ID
router.get('/:id', authenticate, asyncHandler(appointmentController.getAppointmentById));

// Update appointment
router.patch(
  '/:id',
  authenticate,
  validateBody(updateAppointmentSchema),
  asyncHandler(appointmentController.updateAppointment)
);

// Cancel appointment
router.post('/:id/cancel', authenticate, asyncHandler(appointmentController.cancelAppointment));

// Confirm appointment (astrologer only)
router.post('/:id/confirm', authenticate, asyncHandler(appointmentController.confirmAppointment));

export default router;



