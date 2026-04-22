/**
 * Kundali Match Service
 * User submits boy/girl birth details; admin sends text review. Coins deducted on request.
 */

import { prisma, Prisma } from '@jyotish/database';
import { KundaliMatchStatus } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import * as coinService from './coin.service';
import {
  reportingDayEndInclusive,
  reportingDayStart,
  type ReportingYmd,
} from '../utils/reporting-date.utils';

export interface CreateKundaliMatchInput {
  userId: string;
  boyDateOfBirth: string;
  boyTimeOfBirth: string;
  boyPlaceOfBirth: string;
  boyPlaceOfBirthType?: 'NEPAL' | 'OUTSIDE_NEPAL' | null;
  boyPlaceOfBirthPradeshId?: string | null;
  boyPlaceOfBirthDistrictId?: string | null;
  boyPlaceOfBirthLocation?: string | null;
  girlDateOfBirth: string;
  girlTimeOfBirth: string;
  girlPlaceOfBirth: string;
  girlPlaceOfBirthType?: 'NEPAL' | 'OUTSIDE_NEPAL' | null;
  girlPlaceOfBirthPradeshId?: string | null;
  girlPlaceOfBirthDistrictId?: string | null;
  girlPlaceOfBirthLocation?: string | null;
  selectedConsultationQuestionIds: string[];
}

const geoSelect = { id: true, nameEn: true } as const;

/** Geography only — client list (no admin/user joins). */
const kundaliMatchClientListInclude = {
  boyPlaceOfBirthPradesh: { select: geoSelect },
  boyPlaceOfBirthDistrict: { select: geoSelect },
  girlPlaceOfBirthPradesh: { select: geoSelect },
  girlPlaceOfBirthDistrict: { select: geoSelect },
} satisfies Prisma.KundaliMatchRequestInclude;

const kundaliMatchAdminInclude = {
  user: { select: { id: true, name: true, phone: true, email: true } },
  reviewedByAdmin: { select: { id: true, name: true } },
  ...kundaliMatchClientListInclude,
} satisfies Prisma.KundaliMatchRequestInclude;

export interface KundaliMatchRequestRow {
  id: string;
  userId: string;
  boyDateOfBirth: Date;
  boyTimeOfBirth: string;
  boyPlaceOfBirth: string;
  boyPlaceOfBirthType: string | null;
  boyPlaceOfBirthPradeshId: string | null;
  boyPlaceOfBirthDistrictId: string | null;
  boyPlaceOfBirthLocation: string | null;
  girlDateOfBirth: Date;
  girlTimeOfBirth: string;
  girlPlaceOfBirth: string;
  girlPlaceOfBirthType: string | null;
  girlPlaceOfBirthPradeshId: string | null;
  girlPlaceOfBirthDistrictId: string | null;
  girlPlaceOfBirthLocation: string | null;
  selectedConsultationQuestionIds: string[];
  status: KundaliMatchStatus;
  adminReviewMessage: string | null;
  coinsDeducted: number;
  coinTransactionId: string | null;
  reviewedAt: Date | null;
  reviewedByAdminId: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: Pick<import('../types/common.types').UserSummary, 'id' | 'name' | 'phone' | 'email'>;
  reviewedByAdmin?: { id: string; name: string } | null;
  boyPlaceOfBirthPradesh?: { id: string; nameEn: string } | null;
  boyPlaceOfBirthDistrict?: { id: string; nameEn: string } | null;
  girlPlaceOfBirthPradesh?: { id: string; nameEn: string } | null;
  girlPlaceOfBirthDistrict?: { id: string; nameEn: string } | null;
}

function parseDateOnly(dateStr: string): Date {
  return new Date(dateStr + 'T12:00:00.000Z');
}

export async function createRequest(input: CreateKundaliMatchInput): Promise<KundaliMatchRequestRow> {
  const result = await coinService.deductCoinsForKundaliMatch(input.userId);
  const coinCost = result.coinCost;
  const coinTransactionId = result.coinTransactionId || null;

  const request = await prisma.kundaliMatchRequest.create({
    data: {
      userId: input.userId,
      boyDateOfBirth: parseDateOnly(input.boyDateOfBirth),
      boyTimeOfBirth: input.boyTimeOfBirth,
      boyPlaceOfBirth: input.boyPlaceOfBirth,
      boyPlaceOfBirthType: input.boyPlaceOfBirthType ?? null,
      boyPlaceOfBirthPradeshId: input.boyPlaceOfBirthPradeshId ?? null,
      boyPlaceOfBirthDistrictId: input.boyPlaceOfBirthDistrictId ?? null,
      boyPlaceOfBirthLocation: input.boyPlaceOfBirthLocation ?? null,
      girlDateOfBirth: parseDateOnly(input.girlDateOfBirth),
      girlTimeOfBirth: input.girlTimeOfBirth,
      girlPlaceOfBirth: input.girlPlaceOfBirth,
      girlPlaceOfBirthType: input.girlPlaceOfBirthType ?? null,
      girlPlaceOfBirthPradeshId: input.girlPlaceOfBirthPradeshId ?? null,
      girlPlaceOfBirthDistrictId: input.girlPlaceOfBirthDistrictId ?? null,
      girlPlaceOfBirthLocation: input.girlPlaceOfBirthLocation ?? null,
      selectedConsultationQuestionIds: input.selectedConsultationQuestionIds,
      status: KundaliMatchStatus.PENDING,
      coinsDeducted: coinCost,
      coinTransactionId,
    },
  });
  const { AdminStatsEmitter } = require('../utils/admin-stats-emitter');
  AdminStatsEmitter.emitSidebarInvalidate();
  return request as KundaliMatchRequestRow;
}

export async function listMine(
  userId: string,
  options: {
    page: number;
    limit: number;
    status?: KundaliMatchStatus;
    dateFrom?: string;
    dateTo?: string;
  }
) {
  const { page, limit, status, dateFrom, dateTo } = options;
  const skip = (page - 1) * limit;
  const createdFilter = kundaliCreatedAtRange(dateFrom, dateTo);
  const where: Prisma.KundaliMatchRequestWhereInput = {
    userId,
    ...(status ? { status } : {}),
    ...(createdFilter ? { createdAt: createdFilter } : {}),
  };

  const [requests, total] = await Promise.all([
    prisma.kundaliMatchRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: kundaliMatchClientListInclude,
    }),
    prisma.kundaliMatchRequest.count({ where }),
  ]);

  return {
    requests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getById(id: string): Promise<KundaliMatchRequestRow | null> {
  const request = await prisma.kundaliMatchRequest.findUnique({
    where: { id },
    include: kundaliMatchAdminInclude,
  });
  return request as KundaliMatchRequestRow | null;
}

/** Inclusive `createdAt` range: YYYY-MM-DD interpreted as calendar days in Asia/Kathmandu (same as admin month filter intent). */
function kundaliCreatedAtRange(dateFrom?: string, dateTo?: string): Prisma.DateTimeFilter | undefined {
  if (!dateFrom && !dateTo) return undefined;
  const ymdOk = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
  const f: Prisma.DateTimeFilter = {};
  if (dateFrom && ymdOk(dateFrom)) {
    f.gte = reportingDayStart(dateFrom as ReportingYmd);
  }
  if (dateTo && ymdOk(dateTo)) {
    f.lte = reportingDayEndInclusive(dateTo as ReportingYmd);
  }
  return f;
}

export async function listAdmin(options: {
  page: number;
  limit: number;
  status?: KundaliMatchStatus;
  dateFrom?: string;
  dateTo?: string;
}) {
  const { page, limit, status, dateFrom, dateTo } = options;
  const skip = (page - 1) * limit;
  const createdFilter = kundaliCreatedAtRange(dateFrom, dateTo);
  const where: Prisma.KundaliMatchRequestWhereInput = {
    ...(status ? { status } : {}),
    ...(createdFilter ? { createdAt: createdFilter } : {}),
  };

  const [requests, total] = await Promise.all([
    prisma.kundaliMatchRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: kundaliMatchAdminInclude,
    }),
    prisma.kundaliMatchRequest.count({ where }),
  ]);

  return {
    requests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function submitReview(
  requestId: string,
  adminId: string,
  adminReviewMessage: string
): Promise<KundaliMatchRequestRow> {
  const existing = await prisma.kundaliMatchRequest.findUnique({
    where: { id: requestId },
  });
  if (!existing) {
    throw new AppError('Kundali match request not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  if (existing.status === KundaliMatchStatus.REVIEWED) {
    throw new AppError(
      'This request has already been reviewed',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const updated = await prisma.kundaliMatchRequest.update({
    where: { id: requestId },
    data: {
      status: KundaliMatchStatus.REVIEWED,
      adminReviewMessage,
      reviewedAt: new Date(),
      reviewedByAdminId: adminId,
    },
    include: kundaliMatchAdminInclude,
  });
  const { AdminStatsEmitter } = require('../utils/admin-stats-emitter');
  AdminStatsEmitter.emitSidebarInvalidate();
  return updated as KundaliMatchRequestRow;
}
