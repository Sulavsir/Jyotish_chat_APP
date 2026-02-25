/**
 * Subha Sahit Service - Auspicious dates for Pandit Ji bookings
 */

import { prisma } from '@jyotish/database';

export interface SubhaSahitDate {
  id: string;
  date: Date;
  language: string;
  occasion: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toSubhaSahitDate(entity: any): SubhaSahitDate {
  return {
    id: entity.id,
    date: entity.date,
    language: entity.language,
    occasion: entity.occasion,
    description: entity.description,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

export class SubhaSahitService {
  private normalizeLanguage(language?: string): 'EN' | 'NE' | 'HI' {
    const code = (language ?? 'en').toLowerCase();
    if (code === 'ne' || code === 'np' || code === 'nepali') return 'NE';
    if (code === 'hi' || code === 'hin' || code === 'hindi') return 'HI';
    return 'EN';
  }

  async createOccasion(
    name: string,
    language?: string
  ): Promise<{ id: string; name: string; isActive: boolean; language: string }> {
    const trimmed = name.trim();
    const lang = this.normalizeLanguage(language);

    // Try to find an existing occasion case-insensitively
    const existingWhere: any = {
      occasion: {
        equals: trimmed,
        mode: 'insensitive',
      },
      language: lang,
    };

    const existing = await prisma.subhaSahitDate.findFirst({
      where: existingWhere,
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      const row: any = existing;
      return {
        id: row.id,
        name: row.occasion,
        isActive: row.isActive,
        language: row.language,
      };
    }

    const placeholderDate = new Date('2099-12-31');
    placeholderDate.setHours(0, 0, 0, 0);

    const created = await prisma.subhaSahitDate.create({
      data: {
        date: placeholderDate,
        occasion: trimmed,
        isActive: true,
        language: lang,
      } as any,
    });

    const row: any = created;
    return {
      id: row.id,
      name: row.occasion,
      isActive: row.isActive,
      language: row.language,
    };
  }

  /**
   * Admin: create one or more Subha Sahit dates. Single API for one item or batch.
   */
  async createDates(
    items: Array<{
      date: string;
      occasion: string;
      description?: string;
    }>,
    language?: string
  ): Promise<SubhaSahitDate[]> {
    const lang = this.normalizeLanguage(language);
    const created: SubhaSahitDate[] = [];
    for (const item of items) {
      const date = new Date(item.date);
      date.setHours(0, 0, 0, 0);

      // No need to create placeholder - occasions are derived from actual dates

      const row = await prisma.subhaSahitDate.create({
        data: {
          date,
          occasion: item.occasion,
          description: item.description || null,
          language: lang,
        } as any,
      });
      created.push(toSubhaSahitDate(row));
    }
    return created;
  }

  /**
   * Admin: list Subha Sahit dates (with optional filters)
   * Excludes placeholder dates (2099-12-31) used for occasion management
   */
  async listDates(params: {
    dateFrom?: string;
    dateTo?: string;
    occasion?: string;
    language?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    dates: SubhaSahitDate[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    // Exclude placeholder dates (2099-12-31) used for occasion-only entries
    const placeholderDate = new Date('2099-12-31');
    placeholderDate.setHours(0, 0, 0, 0);

    const where: any = {
      date: {
        not: placeholderDate,
      },
    };

    if (params.language) {
      where.language = this.normalizeLanguage(params.language);
    }

    if (params.occasion) {
      where.occasion = { contains: params.occasion, mode: 'insensitive' };
    }

    if (params.dateFrom || params.dateTo) {
      where.date = {};
      if (params.dateFrom) {
        const from = new Date(params.dateFrom);
        from.setHours(0, 0, 0, 0);
        where.date.gte = from;
      }
      if (params.dateTo) {
        const to = new Date(params.dateTo);
        to.setHours(23, 59, 59, 999);
        where.date.lte = to;
      }
    }

    const [rows, total] = await Promise.all([
      prisma.subhaSahitDate.findMany({
        where,
        orderBy: [{ date: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.subhaSahitDate.count({ where }),
    ]);

    return {
      dates: rows.map(toSubhaSahitDate),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Public: get available dates for Pandit Ji booking
   */
  async getAvailableDates(params: {
    dateFrom?: string;
    dateTo?: string;
    occasion?: string;
    language?: string;
  }): Promise<SubhaSahitDate[]> {
    // Exclude placeholder dates (2099-12-31) used for occasion-only entries
    const placeholderDate = new Date('2099-12-31');
    placeholderDate.setHours(0, 0, 0, 0);

    // Default to today - only show upcoming dates (not yesterday or earlier)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {
      isActive: true,
      date: {
        not: placeholderDate,
        // Always filter to only show dates from today onwards
        gte: params.dateFrom ? new Date(params.dateFrom) : today,
      },
    };

    if (params.language) {
      where.language = this.normalizeLanguage(params.language);
    }

    if (params.occasion) {
      where.occasion = { contains: params.occasion, mode: 'insensitive' };
    }

    if (params.dateTo) {
      const to = new Date(params.dateTo);
      to.setHours(23, 59, 59, 999);
      where.date.lte = to;
    }

    const rows = await prisma.subhaSahitDate.findMany({
      where,
      orderBy: [{ date: 'asc' }],
    });

    return rows.map(toSubhaSahitDate);
  }

  /**
   * Admin: update a Subha Sahit date
   */
  async updateDate(
    id: string,
    data: {
      date?: string;
      occasion?: string;
      description?: string | null;
      isActive?: boolean;
      language?: string;
    }
  ): Promise<SubhaSahitDate> {
    const updateData: any = {};

    if (data.date !== undefined) {
      const date = new Date(data.date);
      date.setHours(0, 0, 0, 0);
      updateData.date = date;
    }
    if (data.occasion !== undefined) {
      updateData.occasion = data.occasion;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }
    if (data.language !== undefined) {
      updateData.language = this.normalizeLanguage(data.language);
    }

    const row = await prisma.subhaSahitDate.update({
      where: { id },
      data: updateData,
    });

    return toSubhaSahitDate(row);
  }

  /**
   * Admin: get a single Subha Sahit date by id
   */
  async getDateById(id: string): Promise<SubhaSahitDate> {
    const row = await prisma.subhaSahitDate.findUniqueOrThrow({
      where: { id },
    });
    return toSubhaSahitDate(row);
  }

  /**
   * Admin: delete a Subha Sahit date
   */
  async deleteDate(id: string): Promise<void> {
    await prisma.subhaSahitDate.delete({
      where: { id },
    });
  }

  /**
   * Get all unique occasions (for filtering)
   * Returns distinct occasions from all SubhaSahitDate entries (including occasion-only placeholders)
   */
  async getOccasions(language?: string): Promise<string[]> {
    const where: any = { isActive: true };
    if (language) {
      where.language = this.normalizeLanguage(language);
    }

    const rows = await prisma.subhaSahitDate.findMany({
      where,
      select: { occasion: true },
      distinct: ['occasion'],
      orderBy: { occasion: 'asc' },
    });
    return rows.map((r) => r.occasion);
  }
}

export const subhaSahitService = new SubhaSahitService();
