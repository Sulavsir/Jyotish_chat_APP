/**
 * Consultation Controller - Handle consultation requests
 * Controllers should be thin - only handle request validation, input handling, and responses
 * All business logic is delegated to services
 * Errors are handled by global error handler
 */

import { Response, NextFunction } from 'express';
import { AuthRequest, ConsultationUserRole } from '../types';
import { sendSuccess } from '../utils';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { consultationService } from '../services';
import { AppError } from '../middleware/error-handler';

/**
 * Get all consultations for a user
 * GET /api/v1/consultations
 */
export const getConsultations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check authentication
  if (!req.user?.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }

  // Get query parameters
  const role = (req.query.role as ConsultationUserRole) || 'CLIENT';

  // Fetch consultations via service
  const consultations = await consultationService.getConsultationsByUserId(req.user.id, role);

  return sendSuccess(res, {
    consultations,
    count: consultations.length,
    message: 'Consultations retrieved successfully',
  });
};

/**
 * Get consultation by ID
 * GET /api/v1/consultations/:id
 */
export const getConsultationById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check authentication
  if (!req.user?.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }

  const { id } = req.params;

  // Fetch consultation via service
  const consultation = await consultationService.getConsultationById(id);

  if (!consultation) {
    throw new AppError('Consultation not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  // Verify user has access to this consultation
  if (consultation.clientId !== req.user.id && consultation.astrologerId !== req.user.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }

  return sendSuccess(res, {
    consultation,
    message: 'Consultation retrieved successfully',
  });
};

/**
 * Book a new consultation
 * POST /api/v1/consultations
 */
export const bookConsultation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check authentication
  if (!req.user?.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }

  const { astrologerId, scheduledAt, duration, type, amount, notes } = req.body;

  // Book consultation via service
  const consultation = await consultationService.bookConsultation({
    clientId: req.user.id,
    astrologerId,
    scheduledAt: new Date(scheduledAt),
    duration: Number(duration),
    type,
    amount: Number(amount),
    notes,
  });

  return sendSuccess(
    res,
    {
      consultation,
      message: 'Consultation booked successfully',
    },
    HTTP_STATUS.CREATED
  );
};

/**
 * Update consultation status
 * PATCH /api/v1/consultations/:id
 */
export const updateConsultation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check authentication
  if (!req.user?.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }

  const { id } = req.params;
  const { status, notes, rating, review } = req.body;

  // Update consultation via service
  const consultation = await consultationService.updateConsultation(id, req.user.id, {
    status,
    notes,
    rating: rating ? Number(rating) : undefined,
    review,
  });

  return sendSuccess(res, {
    consultation,
    message: 'Consultation updated successfully',
  });
};

/**
 * Cancel a consultation
 * POST /api/v1/consultations/:id/cancel
 */
export const cancelConsultation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check authentication
  if (!req.user?.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }

  const { id } = req.params;

  // Cancel consultation via service
  const consultation = await consultationService.cancelConsultation(id, req.user.id);

  return sendSuccess(res, {
    consultation,
    message: 'Consultation cancelled successfully',
  });
};

/**
 * Get upcoming consultations
 * GET /api/v1/consultations/upcoming
 */
export const getUpcomingConsultations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check authentication
  if (!req.user?.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }

  const role = (req.query.role as ConsultationUserRole) || 'CLIENT';

  const consultations = await consultationService.getUpcomingConsultations(req.user.id, role);

  return sendSuccess(res, {
    consultations,
    count: consultations.length,
    message: 'Upcoming consultations retrieved successfully',
  });
};

/**
 * Get consultation history
 * GET /api/v1/consultations/history
 */
export const getConsultationHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check authentication
  if (!req.user?.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }

  const role = (req.query.role as ConsultationUserRole) || 'CLIENT';

  const consultations = await consultationService.getConsultationHistory(req.user.id, role);

  return sendSuccess(res, {
    consultations,
    count: consultations.length,
    message: 'Consultation history retrieved successfully',
  });
};

/**
 * Rate and review a consultation
 * POST /api/v1/consultations/:id/rate
 */
export const rateConsultation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check authentication
  if (!req.user?.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }

  const { id } = req.params;
  const { rating, review } = req.body;

  if (!rating) {
    throw new AppError('Rating is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const consultation = await consultationService.rateConsultation(
    id,
    req.user.id,
    Number(rating),
    review
  );

  return sendSuccess(res, {
    consultation,
    message: 'Consultation rated successfully',
  });
};
