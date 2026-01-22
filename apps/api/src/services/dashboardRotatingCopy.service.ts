/**
 * Dashboard Rotating Copy Service
 */

import { prisma } from '@jyotish/database';
import { AppError, ERROR_CODES, HTTP_STATUS } from '../utils';
import { DASHBOARD_ROTATING_COPY } from '../constants';

type CreateDashboardRotatingCopyInput = {
  title: string;
  subtitle: string;
  isActive?: boolean;
  sortOrder?: number;
};

type UpdateDashboardRotatingCopyInput = Partial<CreateDashboardRotatingCopyInput>;

type DashboardRotatingCopyEntity = {
  id: string;
  title: string;
  subtitle: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

type DashboardRotatingCopyDelegate = {
  findMany: (args: {
    where?: {
      isActive?: boolean;
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' };
        subtitle?: { contains: string; mode: 'insensitive' };
      }>;
    };
    orderBy?: Array<Record<string, 'asc' | 'desc'>>;
    skip?: number;
    take?: number;
  }) => Promise<DashboardRotatingCopyEntity[]>;
  count: (args?: {
    where?: {
      isActive?: boolean;
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' };
        subtitle?: { contains: string; mode: 'insensitive' };
      }>;
    };
  }) => Promise<number>;
  create: (args: {
    data: {
      title: string;
      subtitle: string;
      isActive: boolean;
      sortOrder: number;
    };
  }) => Promise<DashboardRotatingCopyEntity>;
  findUnique: (args: { where: { id: string } }) => Promise<DashboardRotatingCopyEntity | null>;
  update: (args: {
    where: { id: string };
    data: Partial<Pick<DashboardRotatingCopyEntity, 'title' | 'subtitle' | 'isActive' | 'sortOrder'>>;
  }) => Promise<DashboardRotatingCopyEntity>;
  delete: (args: { where: { id: string } }) => Promise<DashboardRotatingCopyEntity>;
};

const dashboardRotatingCopy = (
  prisma as unknown as { dashboardRotatingCopy: DashboardRotatingCopyDelegate }
).dashboardRotatingCopy;

function assertMaxItems(currentCount: number) {
  // Keeping the limit enforcement in service avoids UI spamming too many items.
  if (currentCount >= DASHBOARD_ROTATING_COPY.MAX_ITEMS) {
    throw new AppError(
      'Maximum number of rotating items reached',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
}

export const dashboardRotatingCopyService = {
  async listPublic(): Promise<DashboardRotatingCopyEntity[]> {
    return dashboardRotatingCopy.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  },

  async listAdmin(input?: { page?: number; limit?: number; search?: string }): Promise<{
    items: DashboardRotatingCopyEntity[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = input?.page || 1;
    const limit = input?.limit || 10;
    const skip = (page - 1) * limit;
    const q = input?.search?.trim();

    const where: {
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' };
        subtitle?: { contains: string; mode: 'insensitive' };
      }>;
    } = {};

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { subtitle: { contains: q, mode: 'insensitive' } },
      ];
    }

    const findManyArgs: {
      where?: typeof where;
      orderBy?: Array<Record<string, 'asc' | 'desc'>>;
      skip: number;
      take: number;
    } = {
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      skip,
      take: limit,
    };

    if (Object.keys(where).length > 0) {
      findManyArgs.where = where;
    }

    const countArgs: { where?: typeof where } | undefined =
      Object.keys(where).length > 0 ? { where } : undefined;

    const [items, total] = await Promise.all([
      dashboardRotatingCopy.findMany(findManyArgs),
      dashboardRotatingCopy.count(countArgs),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async create(input: CreateDashboardRotatingCopyInput): Promise<DashboardRotatingCopyEntity> {
    const count = await dashboardRotatingCopy.count();
    assertMaxItems(count);

    return dashboardRotatingCopy.create({
      data: {
        title: input.title,
        subtitle: input.subtitle,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
      },
    });
  },

  async update(id: string, input: UpdateDashboardRotatingCopyInput): Promise<DashboardRotatingCopyEntity> {
    const existing = await dashboardRotatingCopy.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Rotating copy not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    return dashboardRotatingCopy.update({
      where: { id },
      data: {
        title: input.title ?? undefined,
        subtitle: input.subtitle ?? undefined,
        isActive: input.isActive ?? undefined,
        sortOrder: input.sortOrder ?? undefined,
      },
    });
  },

  async toggle(id: string): Promise<DashboardRotatingCopyEntity> {
    const existing = await dashboardRotatingCopy.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Rotating copy not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    return dashboardRotatingCopy.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
  },

  async remove(id: string): Promise<void> {
    const existing = await dashboardRotatingCopy.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Rotating copy not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    await dashboardRotatingCopy.delete({ where: { id } });
  },
};

