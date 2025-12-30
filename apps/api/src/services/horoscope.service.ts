/**
 * Horoscope Service - Handle horoscope and subscription business logic
 */

import { prisma } from '@jyotish/database';
import { HOROSCOPE_CONFIG } from '../constants';
import type { 
  HoroscopeData, 
  SubscriptionData, 
  SubscriptionFrequency, 
  ZodiacSign,
  HoroscopeResponse,
  HoroscopeSubscriptionEntity
} from '../types';

export class HoroscopeService {
  /**
   * Get daily horoscope for a zodiac sign
   */
  async getDailyHoroscope(zodiacSign: string, date?: Date): Promise<HoroscopeResponse> {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);

    // TODO: Integrate with actual horoscope API or database
    // For now, return mock data structure
    return {
      zodiacSign,
      date: targetDate,
      prediction:
        'This is a placeholder horoscope. Integration with horoscope data source pending.',
      category: 'DAILY',
      love: 4,
      career: 3,
      health: 5,
      finance: 3,
    };
  }

  /**
   * Get weekly horoscope for a zodiac sign
   */
  async getWeeklyHoroscope(zodiacSign: string): Promise<HoroscopeResponse> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      zodiacSign,
      date: today,
      prediction:
        'This is a placeholder weekly horoscope. Integration with horoscope data source pending.',
      category: 'WEEKLY',
      love: 4,
      career: 3,
      health: 5,
      finance: 3,
    };
  }

  /**
   * Get monthly horoscope for a zodiac sign
   */
  async getMonthlyHoroscope(zodiacSign: string): Promise<HoroscopeResponse> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      zodiacSign,
      date: today,
      prediction:
        'This is a placeholder monthly horoscope. Integration with horoscope data source pending.',
      category: 'MONTHLY',
      love: 4,
      career: 3,
      health: 5,
      finance: 3,
    };
  }

  /**
   * Subscribe user to horoscope notifications
   */
  async subscribeToHoroscope(data: SubscriptionData): Promise<HoroscopeSubscriptionEntity> {
    // Check if subscription already exists
    const existingSubscription = await prisma.horoscopeSubscription.findUnique({
      where: { userId: data.userId },
    });

    if (existingSubscription) {
      // Update existing subscription
      return await prisma.horoscopeSubscription.update({
        where: { userId: data.userId },
        data: {
          isActive: true,
          frequency: data.frequency || existingSubscription.frequency,
          deliveryTime: data.deliveryTime || existingSubscription.deliveryTime,
        },
      });
    }

    // Create new subscription
    return await prisma.horoscopeSubscription.create({
      data: {
        userId: data.userId,
        isActive: true,
        frequency: data.frequency || HOROSCOPE_CONFIG.DEFAULT_FREQUENCY,
        deliveryTime: data.deliveryTime || HOROSCOPE_CONFIG.DEFAULT_DELIVERY_TIME,
      },
    });
  }

  /**
   * Unsubscribe user from horoscope notifications
   */
  async unsubscribeFromHoroscope(userId: string): Promise<HoroscopeSubscriptionEntity> {
    const subscription = await prisma.horoscopeSubscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    return await prisma.horoscopeSubscription.update({
      where: { userId },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Get subscription status for a user
   */
  async getSubscriptionStatus(userId: string): Promise<HoroscopeSubscriptionEntity | null> {
    return await prisma.horoscopeSubscription.findUnique({
      where: { userId },
    });
  }

  /**
   * Update subscription preferences
   */
  async updateSubscription(
    userId: string,
    frequency?: SubscriptionFrequency,
    deliveryTime?: string
  ): Promise<HoroscopeSubscriptionEntity> {
    const subscription = await this.getSubscriptionStatus(userId);

    if (!subscription) {
      throw new Error('No subscription found');
    }

    return await prisma.horoscopeSubscription.update({
      where: { userId },
      data: {
        ...(frequency && { frequency }),
        ...(deliveryTime && { deliveryTime }),
      },
    });
  }

  /**
   * Get all active subscriptions (for cron jobs to send notifications)
   */
  async getActiveSubscriptions(frequency: SubscriptionFrequency = 'DAILY'): Promise<Array<HoroscopeSubscriptionEntity & { user: { id: string; name: string | null; phone: string; email: string | null; zodiacSign: string | null } }>> {
    return await prisma.horoscopeSubscription.findMany({
      where: {
        isActive: true,
        frequency,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            zodiacSign: true,
          },
        },
      },
    });
  }

  /**
   * Get horoscope by zodiac sign (for user profile)
   */
  async getHoroscopeForUser(userId: string): Promise<HoroscopeResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { zodiacSign: true },
    });

    if (!user?.zodiacSign) {
      throw new Error('User zodiac sign not set');
    }

    return await this.getDailyHoroscope(user.zodiacSign);
  }

  /**
   * Validate zodiac sign
   */
  isValidZodiacSign(sign: string): boolean {
    return HOROSCOPE_CONFIG.VALID_ZODIAC_SIGNS.includes(sign.toUpperCase() as any);
  }
}

export const horoscopeService = new HoroscopeService();

