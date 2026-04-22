/**
 * Subha Sahit Service - Auspicious dates for Pandit Ji bookings
 */

import {
  prisma,
  SubhaSahitDate as PrismaSubhaSahitDate,
  Prisma,
  type SubhaSahitLanguage,
} from '@jyotish/database';
import {
  normalizeToDbLanguageCode,
  type DbLanguageCode,
  type SubhaSahitApiLanguage,
  type SubhaSahitOccasionListItem,
} from '@jyotish/shared';
import { AppError } from '../middleware/error-handler';
import { ERROR_CODES, HTTP_STATUS } from '../constants/http.constants';
import {
  type ReportingYmd,
  getReportingYmd,
  reportingDayEndInclusive,
  reportingDayStart,
} from '../utils/reporting-date.utils';

export interface SubhaSahitDate {
  id: string;
  date: Date;
  language: DbLanguageCode;
  occasion: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toSubhaSahitDate(entity: PrismaSubhaSahitDate): SubhaSahitDate {
  return {
    id: entity.id,
    date: entity.date,
    language: entity.language as DbLanguageCode,
    occasion: entity.occasion,
    description: entity.description,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

function subhaSahitDbLangToApi(lang: SubhaSahitLanguage): SubhaSahitApiLanguage {
  if (lang === 'NE') return 'ne';
  if (lang === 'HI') return 'hi';
  return 'en';
}

export class SubhaSahitService {
  private toReportingDayDate(dateLike: string | Date): Date {
    const raw = typeof dateLike === 'string' ? dateLike : dateLike.toISOString();
    const ymd = raw.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
      // Fall back to Date parsing, then normalize to reporting day start
      return reportingDayStart(getReportingYmd(new Date(raw)));
    }
    return reportingDayStart(ymd as ReportingYmd);
  }

  private toReportingDayEndInclusive(dateLike: string | Date): Date {
    const raw = typeof dateLike === 'string' ? dateLike : dateLike.toISOString();
    const ymd = raw.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
      return reportingDayEndInclusive(getReportingYmd(new Date(raw)));
    }
    return reportingDayEndInclusive(ymd as ReportingYmd);
  }

  async createOccasion(
    name: string,
    language?: string,
    meta?: { pujaItems?: string | null; estimatedTime?: string | null }
  ): Promise<{ id: string; name: string; isActive: boolean; language: DbLanguageCode }> {
    const trimmed = name.trim();
    const lang = normalizeToDbLanguageCode(language);

    const applyMetaIfProvided = async (occasionName: string) => {
      if (!meta) return;
      const hasPuja = meta.pujaItems != null && String(meta.pujaItems).trim() !== '';
      const hasTime = meta.estimatedTime != null && String(meta.estimatedTime).trim() !== '';
      if (!hasPuja && !hasTime) return;
      await this.upsertOccasionMeta(lang, occasionName, {
        pujaItems: hasPuja ? String(meta.pujaItems).trim() : null,
        estimatedTime: hasTime ? String(meta.estimatedTime).trim() : null,
      });
    };

    // Try to find an existing occasion case-insensitively
    const existing = await prisma.subhaSahitDate.findFirst({
      where: {
        occasion: {
          equals: trimmed,
          mode: 'insensitive',
        },
        language: lang,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      await applyMetaIfProvided(existing.occasion);
      return {
        id: existing.id,
        name: existing.occasion,
        isActive: existing.isActive,
        language: existing.language as DbLanguageCode,
      };
    }

    const placeholderDate = this.toReportingDayDate('2099-12-31');

    const created = await prisma.subhaSahitDate.create({
      data: {
        date: placeholderDate,
        occasion: trimmed,
        isActive: true,
        language: lang,
      },
    });

    await applyMetaIfProvided(created.occasion);

    return {
      id: created.id,
      name: created.occasion,
      isActive: created.isActive,
      language: created.language as DbLanguageCode,
    };
  }

  /**
   * Admin: create or update puja item list and estimated time for an occasion (by language + name).
   */
  async upsertOccasionMeta(
    language: string,
    occasion: string,
    data: { pujaItems?: string | null; estimatedTime?: string | null }
  ): Promise<void> {
    const lang = normalizeToDbLanguageCode(language);
    const occ = occasion.trim();
    if (!occ) {
      throw new Error('Occasion is required');
    }

    const pujaItems =
      data.pujaItems === undefined
        ? undefined
        : data.pujaItems === null || data.pujaItems.trim() === ''
          ? null
          : data.pujaItems.trim();
    const estimatedTime =
      data.estimatedTime === undefined
        ? undefined
        : data.estimatedTime === null || data.estimatedTime.trim() === ''
          ? null
          : data.estimatedTime.trim();

    const row = await prisma.subhaSahitOccasionMeta.findFirst({
      where: {
        language: lang,
        occasion: { equals: occ, mode: 'insensitive' },
      },
    });

    if (row) {
      await prisma.subhaSahitOccasionMeta.update({
        where: { id: row.id },
        data: {
          ...(pujaItems !== undefined ? { pujaItems } : {}),
          ...(estimatedTime !== undefined ? { estimatedTime } : {}),
        },
      });
      return;
    }

    await prisma.subhaSahitOccasionMeta.create({
      data: {
        language: lang,
        occasion: occ,
        pujaItems: pujaItems ?? null,
        estimatedTime: estimatedTime ?? null,
      },
    });
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
    const lang = normalizeToDbLanguageCode(language);
    const created: SubhaSahitDate[] = [];
    for (const item of items) {
      const date = this.toReportingDayDate(item.date);

      // No need to create placeholder - occasions are derived from actual dates

      const row = await prisma.subhaSahitDate.create({
        data: {
          date,
          occasion: item.occasion,
          description: item.description || null,
          language: lang,
        },
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
    const placeholderDate = this.toReportingDayDate('2099-12-31');

    // Build date filter
    const dateFilter: Prisma.DateTimeFilter<'SubhaSahitDate'> = {
      not: placeholderDate,
    };

    if (params.dateFrom) {
      dateFilter.gte = this.toReportingDayDate(params.dateFrom);
    }
    if (params.dateTo) {
      dateFilter.lte = this.toReportingDayEndInclusive(params.dateTo);
    }

    const where: Prisma.SubhaSahitDateWhereInput = {
      date: dateFilter,
      ...(params.language && { language: normalizeToDbLanguageCode(params.language) }),
      ...(params.occasion && { occasion: { contains: params.occasion, mode: 'insensitive' } }),
    };

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
    const placeholderDate = this.toReportingDayDate('2099-12-31');

    // Default to today - only show upcoming dates (not yesterday or earlier)
    const today = reportingDayStart(getReportingYmd(new Date()));

    // Build date filter
    const dateFilter: Prisma.DateTimeFilter<'SubhaSahitDate'> = {
      not: placeholderDate,
      gte: params.dateFrom ? this.toReportingDayDate(params.dateFrom) : today,
    };

    if (params.dateTo) {
      dateFilter.lte = this.toReportingDayEndInclusive(params.dateTo);
    }

    const where: Prisma.SubhaSahitDateWhereInput = {
      isActive: true,
      date: dateFilter,
      ...(params.language && { language: normalizeToDbLanguageCode(params.language) }),
      ...(params.occasion && { occasion: { contains: params.occasion, mode: 'insensitive' } }),
    };

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
    const updateData: Prisma.SubhaSahitDateUpdateInput = {};

    if (data.date !== undefined) {
      updateData.date = this.toReportingDayDate(data.date);
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
      updateData.language = normalizeToDbLanguageCode(data.language);
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
   * Distinct occasion names (any language unless filtered). For booking validation and legacy flows.
   */
  async getDistinctOccasionNames(language?: string): Promise<string[]> {
    const where: Prisma.SubhaSahitDateWhereInput = {
      isActive: true,
      ...(language && { language: normalizeToDbLanguageCode(language) }),
    };

    const rows = await prisma.subhaSahitDate.findMany({
      where,
      select: { occasion: true },
      distinct: ['occasion'],
      orderBy: { occasion: 'asc' },
    });
    return rows.map((r) => r.occasion);
  }

  /**
   * Occasions with optional per-occasion metadata (puja items, estimated time).
   * With `language`, omits `language` on each item (client). Without, includes `language` (admin).
   */
  async listOccasionsWithMeta(language?: string): Promise<SubhaSahitOccasionListItem[]> {
    const whereDate: Prisma.SubhaSahitDateWhereInput = {
      isActive: true,
      ...(language && { language: normalizeToDbLanguageCode(language) }),
    };

    const pairs = await prisma.subhaSahitDate.findMany({
      where: whereDate,
      select: { language: true, occasion: true },
      distinct: ['language', 'occasion'],
      orderBy: [{ language: 'asc' }, { occasion: 'asc' }],
    });

    if (pairs.length === 0) return [];

    const metas = await prisma.subhaSahitOccasionMeta.findMany({
      where: {
        OR: pairs.map((p) => ({ language: p.language, occasion: p.occasion })),
      },
    });
    const metaByKey = new Map(
      metas.map((m) => [`${m.language}\0${m.occasion.toLowerCase()}`, m] as const)
    );

    return pairs.map((p) => {
      const m =
        metaByKey.get(`${p.language}\0${p.occasion.toLowerCase()}`) ??
        metas.find(
          (x) =>
            x.language === p.language && x.occasion.toLowerCase() === p.occasion.toLowerCase()
        );
      return {
        occasion: p.occasion,
        ...(!language ? { language: subhaSahitDbLangToApi(p.language) } : {}),
        pujaItems: m?.pujaItems ?? null,
        estimatedTime: m?.estimatedTime ?? null,
      };
    });
  }

  /**
   * Admin: delete an occasion for a language (placeholder SubhaSahitDate rows + SubhaSahitOccasionMeta).
   * Refuses if any non-placeholder Subha Sahit dates use this occasion.
   */
  async deleteOccasion(language: string, occasion: string): Promise<void> {
    const lang = normalizeToDbLanguageCode(language);
    const occ = occasion.trim();
    if (!occ) {
      throw new AppError('Occasion is required', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    const placeholderDate = this.toReportingDayDate('2099-12-31');

    const realDatesCount = await prisma.subhaSahitDate.count({
      where: {
        language: lang,
        occasion: { equals: occ, mode: 'insensitive' },
        date: { not: placeholderDate },
      },
    });

    if (realDatesCount > 0) {
      throw new AppError(
        'This occasion has Subha Sahit dates. Remove or change those dates first.',
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.SUBHA_SAHIT_OCCASION_HAS_DATES
      );
    }

    await prisma.$transaction([
      prisma.subhaSahitDate.deleteMany({
        where: {
          language: lang,
          occasion: { equals: occ, mode: 'insensitive' },
        },
      }),
      prisma.subhaSahitOccasionMeta.deleteMany({
        where: {
          language: lang,
          occasion: { equals: occ, mode: 'insensitive' },
        },
      }),
    ]);
  }
}

export const subhaSahitService = new SubhaSahitService();
