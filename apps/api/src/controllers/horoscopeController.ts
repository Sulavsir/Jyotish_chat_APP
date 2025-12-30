/**
 * Horoscope Controller - Handle horoscope and subscription requests
 * Controllers should be thin - only handle request validation, input handling, and responses
 * All business logic is delegated to services
 * Errors are handled by global error handler
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils';
import { HTTP_STATUS } from '../constants';
import { horoscopeService } from '../services';
import { AppError } from '../middleware/error-handler';

/**
 * Get daily horoscope for a zodiac sign
 * GET /api/v1/horoscope/daily/:zodiacSign
 */
export const getDailyHoroscope = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { zodiacSign } = req.params;
  const date = req.query.date ? new Date(req.query.date as string) : undefined;

  // Get daily horoscope via service
  const horoscope = await horoscopeService.getDailyHoroscope(zodiacSign.toUpperCase(), date);

  return sendSuccess(res, {
    horoscope,
    message: 'Daily horoscope retrieved successfully',
  });
};

/**
 * Get weekly horoscope for a zodiac sign
 * GET /api/v1/horoscope/weekly/:zodiacSign
 */
export const getWeeklyHoroscope = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { zodiacSign } = req.params;

  // Get weekly horoscope via service
  const horoscope = await horoscopeService.getWeeklyHoroscope(zodiacSign.toUpperCase());

  return sendSuccess(res, {
    horoscope,
    message: 'Weekly horoscope retrieved successfully',
  });
};

/**
 * Get monthly horoscope for a zodiac sign
 * GET /api/v1/horoscope/monthly/:zodiacSign
 */
export const getMonthlyHoroscope = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { zodiacSign } = req.params;

  // Get monthly horoscope via service
  const horoscope = await horoscopeService.getMonthlyHoroscope(zodiacSign.toUpperCase());

  return sendSuccess(res, {
    horoscope,
    message: 'Monthly horoscope retrieved successfully',
  });
};

/**
 * Get horoscope for authenticated user (based on their zodiac sign)
 * GET /api/v1/horoscope/my-horoscope
 */
export const getMyHoroscope = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check authentication
  if (!req.user?.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
  }

  // Get user's horoscope via service
  const horoscope = await horoscopeService.getHoroscopeForUser(req.user.id);

  return sendSuccess(res, {
    horoscope,
    message: 'Your horoscope retrieved successfully',
  });
};

/**
 * Subscribe to horoscope notifications
 * POST /api/v1/horoscope/subscribe
 */
export const subscribeToHoroscope = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check authentication
  if (!req.user?.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
  }

  const { frequency, deliveryTime } = req.body;

  // Subscribe via service
  const subscription = await horoscopeService.subscribeToHoroscope({
    userId: req.user.id,
    frequency,
    deliveryTime,
  });

  return sendSuccess(
    res,
    {
      subscription,
      message: 'Successfully subscribed to horoscope notifications',
    },
    HTTP_STATUS.CREATED
  );
};

/**
 * Unsubscribe from horoscope notifications
 * POST /api/v1/horoscope/unsubscribe
 */
export const unsubscribeFromHoroscope = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Check authentication
  if (!req.user?.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
  }

  // Unsubscribe via service
  const subscription = await horoscopeService.unsubscribeFromHoroscope(req.user.id);

  return sendSuccess(res, {
    subscription,
    message: 'Successfully unsubscribed from horoscope notifications',
  });
};

/**
 * Get subscription status
 * GET /api/v1/horoscope/subscription
 */
export const getSubscriptionStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Check authentication
  if (!req.user?.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
  }

  // Get subscription status via service
  const subscription = await horoscopeService.getSubscriptionStatus(req.user.id);

  if (!subscription) {
    return sendSuccess(res, {
      subscription: null,
      isSubscribed: false,
      message: 'No active subscription found',
    });
  }

  return sendSuccess(res, {
    subscription,
    isSubscribed: subscription.isActive,
    message: 'Subscription status retrieved successfully',
  });
};

/**
 * Update subscription preferences
 * PATCH /api/v1/horoscope/subscription
 */
export const updateSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check authentication
  if (!req.user?.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
  }

  const { frequency, deliveryTime } = req.body;

  // Update subscription via service
  const subscription = await horoscopeService.updateSubscription(
    req.user.id,
    frequency,
    deliveryTime
  );

  return sendSuccess(res, {
    subscription,
    message: 'Subscription updated successfully',
  });
};
