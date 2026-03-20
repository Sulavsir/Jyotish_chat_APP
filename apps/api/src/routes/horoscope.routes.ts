import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateParams, validateQuery, validateBody } from '../middleware/validate';
import { asyncHandler } from '../utils';
import { horoscopeController } from '../controllers';
import {
  zodiacSignParamSchema,
  dailyHoroscopeQuerySchema,
  periodHoroscopeQuerySchema,
  horoscopesBatchQuerySchema,
  subscribeHoroscopeSchema,
  updateSubscriptionSchema,
  myHoroscopeQuerySchema,
} from '../validators';

const router = Router();

// Get horoscopes for all zodiac signs in one call
// GET /api/v1/horoscopes?category=DAILY|WEEKLY|MONTHLY|YEARLY&date=YYYY-MM-DD&language=NEPALI|HINDI|ENGLISH
router.get(
  '/',
  validateQuery(horoscopesBatchQuerySchema),
  asyncHandler(horoscopeController.getHoroscopesBatch)
);

// Get daily horoscope by zodiac sign
router.get(
  '/daily/:zodiacSign',
  validateParams(zodiacSignParamSchema),
  validateQuery(dailyHoroscopeQuerySchema),
  asyncHandler(horoscopeController.getDailyHoroscope)
);

// Get weekly horoscope by zodiac sign
router.get(
  '/weekly/:zodiacSign',
  validateParams(zodiacSignParamSchema),
  validateQuery(periodHoroscopeQuerySchema),
  asyncHandler(horoscopeController.getWeeklyHoroscope)
);

// Get monthly horoscope by zodiac sign
router.get(
  '/monthly/:zodiacSign',
  validateParams(zodiacSignParamSchema),
  validateQuery(periodHoroscopeQuerySchema),
  asyncHandler(horoscopeController.getMonthlyHoroscope)
);

// Get yearly horoscope by zodiac sign
router.get(
  '/yearly/:zodiacSign',
  validateParams(zodiacSignParamSchema),
  validateQuery(periodHoroscopeQuerySchema),
  asyncHandler(horoscopeController.getYearlyHoroscope)
);

// Get user's horoscope (based on their zodiac sign)
router.get(
  '/my-horoscope',
  authenticate,
  validateQuery(myHoroscopeQuerySchema),
  asyncHandler(horoscopeController.getMyHoroscope)
);

// Subscribe to horoscope notifications
router.post(
  '/subscribe',
  authenticate,
  validateBody(subscribeHoroscopeSchema),
  asyncHandler(horoscopeController.subscribeToHoroscope)
);

// Unsubscribe from horoscope notifications
router.post(
  '/unsubscribe',
  authenticate,
  asyncHandler(horoscopeController.unsubscribeFromHoroscope)
);

// Get subscription status
router.get('/subscription', authenticate, asyncHandler(horoscopeController.getSubscriptionStatus));

// Update subscription preferences
router.patch(
  '/subscription',
  authenticate,
  validateBody(updateSubscriptionSchema),
  asyncHandler(horoscopeController.updateSubscription)
);

export default router;
