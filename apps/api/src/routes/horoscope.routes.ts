import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateParams, validateQuery, validateBody } from '../middleware/validate';
import { asyncHandler } from '../utils';
import { horoscopeController } from '../controllers';
import {
  zodiacSignParamSchema,
  dailyHoroscopeQuerySchema,
  subscribeHoroscopeSchema,
  updateSubscriptionSchema,
} from '../validators';

const router = Router();

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
  asyncHandler(horoscopeController.getWeeklyHoroscope)
);

// Get monthly horoscope by zodiac sign
router.get(
  '/monthly/:zodiacSign',
  validateParams(zodiacSignParamSchema),
  asyncHandler(horoscopeController.getMonthlyHoroscope)
);

// Get user's horoscope (based on their zodiac sign)
router.get('/my-horoscope', authenticate, asyncHandler(horoscopeController.getMyHoroscope));

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
