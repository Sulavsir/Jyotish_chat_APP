/**
 * Jyotish Booking Controller
 */

import type { Response, NextFunction, Request } from 'express';
import { sendSuccess, AppError, ERROR_CODES, HTTP_STATUS } from '../utils';
import type { AuthRequest } from '../middleware/auth';
import { jyotishBookingService } from '../services/jyotishBooking.service';
import { JyotishBookingStatus, JyotishBookingType } from '@jyotish/database';

/**
 * Client: create booking request
 * POST /api/v1/jyotish-bookings
 */
export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const clientId = req.user?.id;
    if (!clientId) {
      throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    }

    const { type, preferredAstrologerId, bookingDate, category, details, location } = req.body as {
      type: JyotishBookingType;
      preferredAstrologerId?: string;
      bookingDate: string;
      category: string;
      details?: string;
      location: string;
    };

    if (!location || !location.trim()) {
      throw new AppError('Location is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const created = await jyotishBookingService.createForClient({
      clientId,
      type,
      // Only Katha Vachak bookings can include a preferred astrologer selection
      preferredAstrologerId: type === JyotishBookingType.KATHA_VACHAK ? preferredAstrologerId : undefined,
      category,
      bookingDate: new Date(`${bookingDate}T00:00:00.000Z`),
      details,
      location,
    });

    return sendSuccess(res, { booking: created });
  } catch (error) {
    next(error);
  }
}

/**
 * Client: list my booking requests
 * GET /api/v1/jyotish-bookings/my
 */
export async function listMine(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const clientId = req.user?.id;
    if (!clientId) {
      throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    }

    const { page, limit, search, type, status, dateFrom, dateTo } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      type?: JyotishBookingType;
      status?: JyotishBookingStatus;
      dateFrom?: string;
      dateTo?: string;
    };

    const result = await jyotishBookingService.listForClient({
      clientId,
      page,
      limit,
      search,
      type,
      status,
      dateFrom,
      dateTo,
    });
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: list booking requests
 * GET /api/v1/admin/jyotish-bookings
 */
export async function listAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, status, page, limit, search } = req.query as unknown as {
      type?: JyotishBookingType;
      status?: JyotishBookingStatus;
      page: number;
      limit: number;
      search?: string;
    };

    const result = await jyotishBookingService.listAdmin({
      type,
      status,
      page,
      limit,
      search,
    });
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: update booking status (approve/reject)
 * PATCH /api/v1/admin/jyotish-bookings/:id/status
 */
export async function updateStatusAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body as { status: JyotishBookingStatus; adminNotes?: string };

    const updated = await jyotishBookingService.updateStatusAdmin({ id, status, adminNotes });
    return sendSuccess(res, { booking: updated });
  } catch (error) {
    next(error);
  }
}

