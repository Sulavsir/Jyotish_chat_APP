/**
 * Appointment Controller
 * Handles appointment-related HTTP requests
 */

import { Response } from 'express';
import { AppointmentStatus } from '@prisma/client';
import { UserRole } from '@jyotish/shared';
import * as appointmentService from '../services/appointment.service';
import { AuthRequest } from '../types/common.types';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';

/**
 * Create a new appointment
 * POST /api/appointments
 */
export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const clientId = req.user?.id;
    if (!clientId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { astrologerId, scheduledAt, duration, notes } = req.body;

    // Get astrologer to calculate amount
    const { prisma } = await import('@jyotish/database');
    const astrologer = await prisma.astrologer.findUnique({
      where: { id: astrologerId },
      select: { appointmentFee: true, category: true },
    });

    if (!astrologer || !astrologer.appointmentFee) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Astrologer does not have appointment fee set',
      });
    }

    const appointment = await appointmentService.createAppointment({
      clientId,
      astrologerId,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 30,
      amount: astrologer.appointmentFee,
      notes,
    });

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: appointment,
      message: 'Appointment created successfully',
    });
  } catch (error: any) {
    console.error('Create appointment error:', error);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to create appointment',
    });
  }
};

/**
 * Get appointments for the authenticated user
 * GET /api/appointments
 */
export const getMyAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { page, limit, search, status } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      status?: AppointmentStatus;
    };

    const result = await appointmentService.listAppointments({
      userId,
      role: userRole === UserRole.CLIENT ? UserRole.CLIENT : UserRole.ASTROLOGER,
      page,
      limit,
      search,
      status,
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Get appointments error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to get appointments',
    });
  }
};

/**
 * Get a single appointment by ID
 * GET /api/appointments/:id
 */
export const getAppointmentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const appointment = await appointmentService.getAppointmentById(id);

    if (!appointment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Check authorization
    if (appointment.clientId !== userId && appointment.astrologerId !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have access to this appointment',
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: appointment,
    });
  } catch (error: any) {
    console.error('Get appointment error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to get appointment',
    });
  }
};

/**
 * Update appointment status
 * PATCH /api/appointments/:id
 */
export const updateAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    const appointment = await appointmentService.getAppointmentById(id);

    if (!appointment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Check authorization
    if (appointment.clientId !== userId && appointment.astrologerId !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have access to this appointment',
      });
    }

    const updated = await appointmentService.updateAppointment(id, updateData);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updated,
      message: 'Appointment updated successfully',
    });
  } catch (error: any) {
    console.error('Update appointment error:', error);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to update appointment',
    });
  }
};

/**
 * Check availability for an astrologer
 * GET /api/appointments/availability/:astrologerId
 */
export const checkAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { astrologerId } = req.params;
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Date is required in YYYY-MM-DD format',
      });
    }

    const timeSlots = await appointmentService.checkAvailability(astrologerId, date);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: timeSlots,
    });
  } catch (error: any) {
    console.error('Check availability error:', error);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to check availability',
    });
  }
};

/**
 * Cancel an appointment
 * POST /api/appointments/:id/cancel
 */
export const cancelAppointment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const { cancellationNote } = req.body;

  const appointment = await appointmentService.getAppointmentById(id);

  if (!appointment) {
    throw new AppError('Appointment not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  if (appointment.clientId !== userId && appointment.astrologerId !== userId) {
    throw new AppError(
      'You do not have access to this appointment',
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.FORBIDDEN
    );
  }

  const cancelled = await appointmentService.cancelAppointment(id, cancellationNote);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: cancelled,
    message: 'Appointment cancelled successfully',
  });
};

/**
 * Confirm an appointment (astrologer only)
 * POST /api/appointments/:id/confirm
 */
export const confirmAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== 'ASTROLOGER') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only astrologers can confirm appointments',
      });
    }

    const appointment = await appointmentService.getAppointmentById(id);

    if (!appointment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    if (appointment.astrologerId !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have access to this appointment',
      });
    }

    const confirmed = await appointmentService.confirmAppointment(id);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: confirmed,
      message: 'Appointment confirmed successfully',
    });
  } catch (error: any) {
    console.error('Confirm appointment error:', error);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to confirm appointment',
    });
  }
};
