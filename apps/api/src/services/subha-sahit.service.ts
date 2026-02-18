/**
 * Subha Sahit Service - Auspicious dates for Pandit Ji bookings
 */

import { prisma } from '@jyotish/database';

export interface SubhaSahitDate {
  id: string;
  date: Date;
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
    occasion: entity.occasion,
    description: entity.description,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

export class SubhaSahitService {
  /**
   * Admin: create one or more Subha Sahit dates. Single API for one item or batch.
   */
  async createDates(
    items: Array<{
      date: string;
      occasion: string;
      description?: string;
    }>
  ): Promise<SubhaSahitDate[]> {
    const created: SubhaSahitDate[] = [];
    for (const item of items) {
      const date = new Date(item.date);
      date.setHours(0, 0, 0, 0); // Normalize to start of day
      
      const row = await prisma.subhaSahitDate.create({
        data: {
          date,
          occasion: item.occasion,
          description: item.description || null,
        },
      });
      created.push(toSubhaSahitDate(row));
    }
    return created;
  }

  /**
   * Admin: list Subha Sahit dates (with optional filters)
   */
  async listDates(params: {
    dateFrom?: string;
    dateTo?: string;
    occasion?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    dates: SubhaSahitDate[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};

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
   * Public: Get available dates for Pandit Ji booking (only active dates)
   */
  async getAvailableDates(params: {
    dateFrom?: string;
    dateTo?: string;
    occasion?: string;
  }): Promise<SubhaSahitDate[]> {
    const where: any = {
      isActive: true,
    };

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

    const row = await prisma.subhaSahitDate.update({
      where: { id },
      data: updateData,
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
   */
  async getOccasions(): Promise<string[]> {
    const rows = await prisma.subhaSahitDate.findMany({
      select: { occasion: true },
      distinct: ['occasion'],
      where: { isActive: true },
      orderBy: { occasion: 'asc' },
    });
    return rows.map((r) => r.occasion);
  }
}

export const subhaSahitService = new SubhaSahitService();
