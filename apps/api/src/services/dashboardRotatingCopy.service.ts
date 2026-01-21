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
    where?: { isActive?: boolean };
    orderBy?: Array<Record<string, 'asc' | 'desc'>>;
  }) => Promise<DashboardRotatingCopyEntity[]>;
  count: () => Promise<number>;
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

  async listAdmin(): Promise<DashboardRotatingCopyEntity[]> {
    return dashboardRotatingCopy.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
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

