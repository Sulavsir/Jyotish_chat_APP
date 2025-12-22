import { Router } from 'express';
import { prisma } from '@jyotish/database';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { HttpError } from '../middleware/errorHandler';
import { createHoroscopeSchema, getHoroscopeSchema, UserRole } from '@jyotish/shared';
import { formatDate } from '@jyotish/shared';

const router = Router();

// Get horoscope
router.get('/', async (req, res, next) => {
  try {
    const validatedData = getHoroscopeSchema.parse(req.query);
    const date = validatedData.date ? new Date(validatedData.date) : new Date();
    const formattedDate = formatDate(date);

    const horoscope = await prisma.horoscope.findFirst({
      where: {
        zodiacSign: validatedData.zodiacSign,
        date: new Date(formattedDate),
        category: validatedData.category,
      },
    });

    if (!horoscope) {
      throw new HttpError(404, 'Horoscope not found for this date', 'HOROSCOPE_NOT_FOUND');
    }

    res.json({ success: true, data: horoscope });
  } catch (error) {
    next(error);
  }
});

// Get user's daily horoscope (based on their zodiac sign)
router.get('/my-daily', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { zodiacSign: true },
    });

    if (!user?.zodiacSign) {
      throw new HttpError(400, 'Please update your birth details first', 'BIRTH_DETAILS_REQUIRED');
    }

    const today = formatDate(new Date());
    const horoscope = await prisma.horoscope.findFirst({
      where: {
        zodiacSign: user.zodiacSign,
        date: new Date(today),
        category: 'DAILY',
      },
    });

    if (!horoscope) {
      throw new HttpError(404, 'Daily horoscope not available yet', 'HOROSCOPE_NOT_FOUND');
    }

    res.json({ success: true, data: horoscope });
  } catch (error) {
    next(error);
  }
});

// Create horoscope (Admin/Astrologer only)
router.post('/', authenticate, authorize(UserRole.ASTROLOGER, UserRole.ADMIN), async (req: AuthRequest, res, next) => {
  try {
    const validatedData = createHoroscopeSchema.parse(req.body);
    const date = new Date(validatedData.date);

    // Check if horoscope already exists
    const existing = await prisma.horoscope.findFirst({
      where: {
        zodiacSign: validatedData.zodiacSign,
        date,
        category: validatedData.category,
      },
    });

    if (existing) {
      throw new HttpError(400, 'Horoscope already exists for this date', 'HOROSCOPE_EXISTS');
    }

    const horoscope = await prisma.horoscope.create({
      data: {
        zodiacSign: validatedData.zodiacSign,
        date,
        content: validatedData.content,
        category: validatedData.category,
      },
    });

    res.status(201).json({ success: true, data: horoscope });
  } catch (error) {
    next(error);
  }
});

// Subscribe to daily horoscope
router.post('/subscribe', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { frequency = 'DAILY', deliveryTime = '09:00' } = req.body;

    const subscription = await prisma.horoscopeSubscription.upsert({
      where: { userId: req.user!.id },
      update: {
        isActive: true,
        frequency,
        deliveryTime,
      },
      create: {
        userId: req.user!.id,
        frequency,
        deliveryTime,
      },
    });

    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
});

// Unsubscribe from daily horoscope
router.post('/unsubscribe', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await prisma.horoscopeSubscription.update({
      where: { userId: req.user!.id },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

