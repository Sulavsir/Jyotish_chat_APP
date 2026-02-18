/**
 * Horoscope Service - Handle horoscope and subscription business logic
 */

import { prisma } from '@jyotish/database';
import { getCanonicalDateForCategory } from '@jyotish/shared';
import type { QuestionnaireLanguage } from '@jyotish/shared';
import { HOROSCOPE_CONFIG } from '../constants';
import type {
  SubscriptionData,
  SubscriptionFrequency,
  HoroscopeResponse,
  HoroscopeSubscriptionEntity,
} from '../types';
import { HoroscopeCategory } from '@jyotish/shared';

const DEFAULT_HOROSCOPE_LANGUAGE: QuestionnaireLanguage = 'NEPALI';

export class HoroscopeService {
  private toResponse(
    zodiacSign: string,
    date: Date,
    content: string,
    category: HoroscopeCategory
  ): HoroscopeResponse {
    return {
      zodiacSign,
      date,
      prediction: content,
      category,
    };
  }

  /**
   * Get daily horoscope for a zodiac sign (from DB), optionally by language
   */
  async getDailyHoroscope(
    zodiacSign: string,
    date?: Date,
    language?: QuestionnaireLanguage
  ): Promise<HoroscopeResponse> {
    const targetDate = date ? new Date(date) : new Date();
    const canonical = getCanonicalDateForCategory('DAILY', targetDate);
    const lang = language ?? DEFAULT_HOROSCOPE_LANGUAGE;

    const row = await prisma.horoscope.findFirst({
      where: {
        zodiacSign: zodiacSign.toUpperCase() as any,
        category: 'DAILY',
        date: canonical,
        language: lang,
      },
    });

    if (row) {
      return this.toResponse(row.zodiacSign, row.date, row.content, row.category as HoroscopeCategory);
    }

    return this.toResponse(
      zodiacSign.toUpperCase(),
      canonical,
      'No horoscope available for this date. Check back later.',
      HoroscopeCategory.DAILY
    );
  }

  /**
   * Get weekly horoscope for a zodiac sign (from DB), optionally by language
   */
  async getWeeklyHoroscope(
    zodiacSign: string,
    date?: Date,
    language?: QuestionnaireLanguage
  ): Promise<HoroscopeResponse> {
    const targetDate = date ? new Date(date) : new Date();
    const canonical = getCanonicalDateForCategory('WEEKLY', targetDate);
    const lang = language ?? DEFAULT_HOROSCOPE_LANGUAGE;

    const row = await prisma.horoscope.findFirst({
      where: {
        zodiacSign: zodiacSign.toUpperCase() as any,
        category: 'WEEKLY',
        date: canonical,
        language: lang,
      },
    });

    if (row) {
      return this.toResponse(row.zodiacSign, row.date, row.content, row.category as HoroscopeCategory);
    }

    return this.toResponse(
      zodiacSign.toUpperCase(),
      canonical,
      'No weekly horoscope available for this period. Check back later.',
      HoroscopeCategory.WEEKLY
    );
  }

  /**
   * Get monthly horoscope for a zodiac sign (from DB), optionally by language
   */
  async getMonthlyHoroscope(
    zodiacSign: string,
    date?: Date,
    language?: QuestionnaireLanguage
  ): Promise<HoroscopeResponse> {
    const targetDate = date ? new Date(date) : new Date();
    const canonical = getCanonicalDateForCategory('MONTHLY', targetDate);
    const lang = language ?? DEFAULT_HOROSCOPE_LANGUAGE;

    const row = await prisma.horoscope.findFirst({
      where: {
        zodiacSign: zodiacSign.toUpperCase() as any,
        category: 'MONTHLY',
        date: canonical,
        language: lang,
      },
    });

    if (row) {
      return this.toResponse(row.zodiacSign, row.date, row.content, row.category as HoroscopeCategory);
    }

    return this.toResponse(
      zodiacSign.toUpperCase(),
      canonical,
      'No monthly horoscope available for this month. Check back later.',
      HoroscopeCategory.MONTHLY
    );
  }

  /**
   * Get yearly horoscope for a zodiac sign (from DB), optionally by language
   */
  async getYearlyHoroscope(
    zodiacSign: string,
    date?: Date,
    language?: QuestionnaireLanguage
  ): Promise<HoroscopeResponse> {
    const targetDate = date ? new Date(date) : new Date();
    const canonical = getCanonicalDateForCategory('YEARLY', targetDate);
    const lang = language ?? DEFAULT_HOROSCOPE_LANGUAGE;

    const row = await prisma.horoscope.findFirst({
      where: {
        zodiacSign: zodiacSign.toUpperCase() as any,
        category: 'YEARLY',
        date: canonical,
        language: lang,
      },
    });

    if (row) {
      return this.toResponse(row.zodiacSign, row.date, row.content, row.category as HoroscopeCategory);
    }

    return this.toResponse(
      zodiacSign.toUpperCase(),
      canonical,
      'No yearly horoscope available for this year. Check back later.',
      HoroscopeCategory.YEARLY
    );
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
   * Get horoscope by zodiac sign (for user profile), optionally by language
   */
  async getHoroscopeForUser(
    userId: string,
    language?: QuestionnaireLanguage
  ): Promise<HoroscopeResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { zodiacSign: true },
    });

    if (!user?.zodiacSign) {
      throw new Error('User zodiac sign not set');
    }

    return await this.getDailyHoroscope(user.zodiacSign, undefined, language);
  }

  /**
   * Validate zodiac sign
   */
  isValidZodiacSign(sign: string): boolean {
    return HOROSCOPE_CONFIG.VALID_ZODIAC_SIGNS.includes(sign.toUpperCase() as any);
  }

  // ==================== Admin CRUD ====================

  /**
   * Create one or more horoscope entries (admin) – single or bulk; same API
   */
  async createHoroscopes(
    items: Array<{
      zodiacSign: string;
      category: HoroscopeCategory;
      date: Date;
      content: string;
      language?: QuestionnaireLanguage;
    }>
  ) {
    const created = [];
    for (const data of items) {
      const canonical = getCanonicalDateForCategory(data.category, data.date);
      const language = data.language ?? DEFAULT_HOROSCOPE_LANGUAGE;
      const row = await prisma.horoscope.create({
        data: {
          zodiacSign: data.zodiacSign.toUpperCase() as any,
          category: data.category,
          date: canonical,
          content: data.content,
          language,
        },
      });
      created.push(row);
    }
    return created;
  }

  /**
   * List horoscopes with filters (admin)
   */
  async listHoroscopes(params: {
    category?: HoroscopeCategory;
    zodiacSign?: string;
    language?: QuestionnaireLanguage;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.category) where.category = params.category;
    if (params.zodiacSign) where.zodiacSign = params.zodiacSign.toUpperCase();
    if (params.language) where.language = params.language;
    if (params.dateFrom || params.dateTo) {
      where.date = {};
      if (params.dateFrom) where.date.gte = new Date(params.dateFrom);
      if (params.dateTo) {
        const d = new Date(params.dateTo);
        d.setHours(23, 59, 59, 999);
        where.date.lte = d;
      }
    }

    const [items, total] = await Promise.all([
      prisma.horoscope.findMany({
        where,
        orderBy: [{ date: 'desc' }, { zodiacSign: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.horoscope.count({ where }),
    ]);

    return {
      horoscopes: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get horoscope by id (admin)
   */
  async getHoroscopeById(id: string) {
    return prisma.horoscope.findUnique({
      where: { id },
    });
  }

  /**
   * Update horoscope (admin)
   */
  async updateHoroscope(
    id: string,
    data: {
      zodiacSign?: string;
      category?: HoroscopeCategory;
      date?: Date;
      content?: string;
      language?: QuestionnaireLanguage;
    }
  ) {
    const existing = await prisma.horoscope.findUnique({ where: { id } });
    if (!existing) return null;

    const payload: any = {};
    if (data.content !== undefined) payload.content = data.content;
    if (data.zodiacSign !== undefined) payload.zodiacSign = data.zodiacSign.toUpperCase();
    if (data.category !== undefined) payload.category = data.category;
    if (data.language !== undefined) payload.language = data.language;
    if (data.date !== undefined) {
      payload.date = getCanonicalDateForCategory(
        (data.category ?? existing.category) as HoroscopeCategory,
        data.date
      );
    }

    return prisma.horoscope.update({
      where: { id },
      data: payload,
    });
  }

  /**
   * Delete horoscope (admin)
   */
  async deleteHoroscope(id: string) {
    return prisma.horoscope.delete({
      where: { id },
    });
  }
}

export const horoscopeService = new HoroscopeService();

