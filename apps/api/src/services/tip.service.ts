/**
 * Tip Service - Daily dashboard tips for clients and jyotish
 */

import { prisma } from '@jyotish/database';
import type { DailyTip, TipAudience, QuestionnaireLanguage } from '@jyotish/shared';
import { getCanonicalDateForCategory } from '@jyotish/shared';

function toDailyTip(entity: any): DailyTip {
  return {
    id: entity.id,
    date: entity.date,
    language: entity.language,
    audience: entity.audience,
    text: entity.text,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

export class TipService {
  /**
   * Get tips for a specific date, audience and language.
   * Date is canonicalized to DAILY bucket.
   */
  async getTipsForDate(params: {
    date?: Date;
    audience?: TipAudience;
    language?: QuestionnaireLanguage;
  }): Promise<DailyTip[]> {
    const now = params.date ?? new Date();
    const canonical = getCanonicalDateForCategory('DAILY', now);

    const where: any = {
      date: canonical,
      isActive: true,
    };

    if (params.language) {
      where.language = params.language;
    }

    if (params.audience && params.audience !== 'BOTH') {
      // Include tips targeted to specific audience and BOTH
      where.audience = { in: [params.audience, 'BOTH'] };
    } else {
      where.audience = { in: ['CLIENT', 'JYOTISH', 'BOTH'] };
    }

    const rows = await prisma.dailyTip.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    return rows.map(toDailyTip);
  }

  /**
   * Admin: create one or more tips. Single API for one item or batch (array of 1 or more).
   */
  async createTips(
    items: Array<{
      date: string;
      text: string;
      language: QuestionnaireLanguage;
      audience: TipAudience;
    }>
  ): Promise<DailyTip[]> {
    const created: DailyTip[] = [];
    for (const item of items) {
      const canonical = getCanonicalDateForCategory('DAILY', new Date(item.date));
      const row = await prisma.dailyTip.create({
        data: {
          date: canonical,
          text: item.text,
          language: item.language,
          audience: item.audience,
        },
      });
      created.push(toDailyTip(row));
    }
    return created;
  }

  /**
   * Admin: list tips (with optional filters)
   */
  async listTips(params: {
    dateFrom?: string;
    dateTo?: string;
    language?: QuestionnaireLanguage;
    audience?: TipAudience;
    page?: number;
    limit?: number;
  }): Promise<{ tips: DailyTip[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.language) {
      where.language = params.language;
    }

    if (params.audience) {
      if (params.audience === 'BOTH') {
        where.audience = { in: ['CLIENT', 'JYOTISH', 'BOTH'] };
      } else {
        where.audience = { in: [params.audience, 'BOTH'] };
      }
    }

    if (params.dateFrom || params.dateTo) {
      where.date = {};
      if (params.dateFrom) {
        where.date.gte = new Date(params.dateFrom);
      }
      if (params.dateTo) {
        const to = new Date(params.dateTo);
        to.setHours(23, 59, 59, 999);
        where.date.lte = to;
      }
    }

    const [rows, total] = await Promise.all([
      prisma.dailyTip.findMany({
        where,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.dailyTip.count({ where }),
    ]);

    return {
      tips: rows.map(toDailyTip),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin: delete a tip
   */
  async deleteTip(id: string): Promise<void> {
    await prisma.dailyTip.delete({
      where: { id },
    });
  }
}

export const tipService = new TipService();

