/**
 * Appointment Controller
 * Handles appointment-related HTTP requests
 */

import { Response } from 'express';
import { AppointmentStatus, BookingType } from '@prisma/client';
import { AstrologerNotificationSoundCue, UserRole } from '@jyotish/shared';
import * as appointmentService from '../services/appointment.service';
import * as appointmentQuoteService from '../services/appointmentQuote.service';
import { AuthRequest } from '../types/common.types';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { getSocketInstance } from '../utils/socket-instance';
import { emitAstrologerNotificationSoundToUser } from '../utils/astrologer-notification-sound';

/**
 * Create a new appointment.
 * With slotId + bookingType: deducts coins and creates CONFIRMED booking.
 * Without: legacy PENDING (coins deducted when Jyotish confirms).
 * POST /api/v1/appointments
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

    const { astrologerId, scheduledAt, duration, notes, slotId, bookingType } = req.body;

    const { prisma } = await import('@jyotish/database');
    const astrologer = await prisma.astrologer.findUnique({
      where: { id: astrologerId },
      select: { appointmentFee: true, category: true },
    });

    if (!astrologer) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Astrologer not found',
      });
    }

    if (slotId != null && bookingType != null) {
      const coinService = await import('../services/coin.service');
      let deduction: { coinTransactionId: string; coinCost: number } | undefined;
      try {
        const result = await coinService.deductCoinsForBooking(clientId, astrologerId, bookingType);
        if (result.coinCost > 0) {
          deduction = { coinTransactionId: result.coinTransactionId, coinCost: result.coinCost };
        }
      } catch (coinError: any) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: coinError.message || 'insufficient balance. Please top up to book.',
        });
      }

      // Use astrologer-specific appointment fee for Full Kundali Review
      const amount = astrologer.appointmentFee ?? 0;

      const appointment = await appointmentService.createAppointment({
        clientId,
        astrologerId,
        scheduledAt: new Date(), // overwritten by slot in service
        duration: 30,
        amount,
        notes,
        slotId,
        bookingType,
      });

      if (deduction?.coinTransactionId) {
        await coinService.linkAppointmentToCoinEarning(deduction.coinTransactionId, appointment.id);
      }

      const ioSlot = getSocketInstance();
      if (ioSlot) {
        emitAstrologerNotificationSoundToUser(
          ioSlot,
          astrologerId,
          AstrologerNotificationSoundCue.DIRECT_CHAT_OR_KUNDALI_REVIEW
        );
      }

      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: appointment,
        message: 'Booking confirmed successfully',
      });
    }

    if (!astrologer.appointmentFee) {
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

    const ioLegacy = getSocketInstance();
    if (ioLegacy) {
      emitAstrologerNotificationSoundToUser(
        ioLegacy,
        astrologerId,
        AstrologerNotificationSoundCue.DIRECT_CHAT_OR_KUNDALI_REVIEW
      );
    }

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: appointment,
      message: 'Appointment created successfully',
    });
  } catch (error: unknown) {
    console.error('Create appointment error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create appointment';
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message,
    });
  }
};

/**
 * Quote for booking (balance vs astrologer appointment fee) before deduct.
 * GET /api/v1/appointments/booking-quote?astrologerId=&bookingType=KUNDALI_REVIEW&slotId=
 */
export const getBookingQuote = async (req: AuthRequest, res: Response) => {
  try {
    const clientId = req.user?.id;
    if (!clientId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Unauthorized',
      });
    }
    const { astrologerId, bookingType, slotId } = req.query as {
      astrologerId: string;
      bookingType: appointmentQuoteService.BookingQuoteBookingType;
      slotId?: string;
    };
    const data = await appointmentQuoteService.getBookingQuote(clientId, {
      astrologerId,
      bookingType,
      slotId: slotId || undefined,
    });
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get booking quote';
    const status = error instanceof AppError ? error.statusCode : HTTP_STATUS.BAD_REQUEST;
    return res.status(status).json({
      success: false,
      message,
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

    const { page, limit, search, status, statuses, dateFrom, dateTo } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      status?: AppointmentStatus;
      statuses?: AppointmentStatus[];
      dateFrom?: string;
      dateTo?: string;
    };

    const result = await appointmentService.listAppointments({
      userId,
      role: userRole === UserRole.CLIENT ? UserRole.CLIENT : UserRole.ASTROLOGER,
      page,
      limit,
      search,
      status,
      statuses,
      dateFrom,
      dateTo,
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
 * Confirm an appointment (astrologer only). Coins are deducted from client when Jyotish confirms.
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

    if (appointment.status !== AppointmentStatus.PENDING) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Only pending appointments can be confirmed',
      });
    }

    const coinService = await import('../services/coin.service');
    let deduction: { coinTransactionId: string; coinCost: number } | undefined;
    try {
      const dynamicFee =
        (appointment.amount as number | null) ??
        (appointment.astrologer?.appointmentFee as number | null) ??
        0;
      const earningKind =
        appointment.bookingType === BookingType.KUNDALI_REVIEW
          ? ('KUNDALI_REVIEW' as const)
          : ('APPOINTMENT' as const);
      const result = await coinService.deductCoinsForAppointment(
        appointment.clientId,
        appointment.astrologerId,
        dynamicFee,
        earningKind
      );
      if (result.coinCost > 0) {
        deduction = { coinTransactionId: result.coinTransactionId, coinCost: result.coinCost };
      }
    } catch (coinError: any) {
      console.error('Appointment confirm: coin deduction error', coinError);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message:
          coinError.message ||
          'Cannot confirm: client has insufficient balance. Ask them to top up.',
      });
    }

    const confirmed = await appointmentService.confirmAppointment(id);

    if (deduction?.coinTransactionId) {
      await coinService.linkAppointmentToCoinEarning(deduction.coinTransactionId, id);
    }

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
