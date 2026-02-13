/**
 * Appointment Routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { asyncHandler } from '../utils';
import * as appointmentController from '../controllers/appointmentController';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  checkAvailabilitySchema,
  listMyAppointmentsQuerySchema,
  cancelAppointmentSchema,
  listAvailableSlotsQuerySchema,
} from '../validators';
import * as slotController from '../controllers/slotController';

const router = Router();

// List available slots for an astrologer (client booking: appointment or kundali review)
router.get(
  '/slots/:astrologerId',
  authenticate,
  validateQuery(listAvailableSlotsQuerySchema),
  asyncHandler(slotController.listAvailableSlots)
);

// Create appointment
router.post(
  '/',
  authenticate,
  validateBody(createAppointmentSchema),
  asyncHandler(appointmentController.createAppointment)
);

// Get user's appointments
router.get(
  '/my',
  authenticate,
  validateQuery(listMyAppointmentsQuerySchema),
  asyncHandler(appointmentController.getMyAppointments)
);

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

// Jyotish does not confirm or cancel appointments; status flows CONFIRMED -> IN_PROGRESS -> COMPLETED. Commented out per product requirement.
// Cancel appointment
// router.post(
//   '/:id/cancel',
//   authenticate,
//   validateBody(cancelAppointmentSchema),
//   asyncHandler(appointmentController.cancelAppointment)
// );
// Confirm appointment (astrologer only)
// router.post('/:id/confirm', authenticate, asyncHandler(appointmentController.confirmAppointment));

export default router;



