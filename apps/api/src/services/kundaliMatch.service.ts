/**
 * Kundali Match Service
 * User submits boy/girl birth details; admin sends text review. Coins deducted on request.
 */

import { prisma } from '@jyotish/database';
import { KundaliMatchStatus } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import * as coinService from './coin.service';

export interface CreateKundaliMatchInput {
  userId: string;
  boyDateOfBirth: string;
  boyTimeOfBirth: string;
  boyPlaceOfBirth: string;
  girlDateOfBirth: string;
  girlTimeOfBirth: string;
  girlPlaceOfBirth: string;
}

export interface KundaliMatchRequestRow {
  id: string;
  userId: string;
  boyDateOfBirth: Date;
  boyTimeOfBirth: string;
  boyPlaceOfBirth: string;
  girlDateOfBirth: Date;
  girlTimeOfBirth: string;
  girlPlaceOfBirth: string;
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
      girlDateOfBirth: parseDateOnly(input.girlDateOfBirth),
      girlTimeOfBirth: input.girlTimeOfBirth,
      girlPlaceOfBirth: input.girlPlaceOfBirth,
      status: KundaliMatchStatus.PENDING,
      coinsDeducted: coinCost,
      coinTransactionId,
    },
  });
  return request as KundaliMatchRequestRow;
}

export async function listMine(
  userId: string,
  options: { page: number; limit: number; status?: KundaliMatchStatus }
) {
  const { page, limit, status } = options;
  const skip = (page - 1) * limit;
  const where = { userId, ...(status ? { status } : {}) };

  const [requests, total] = await Promise.all([
    prisma.kundaliMatchRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
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
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      reviewedByAdmin: { select: { id: true, name: true } },
    },
  });
  return request as KundaliMatchRequestRow | null;
}

export async function listAdmin(options: {
  page: number;
  limit: number;
  status?: KundaliMatchStatus;
}) {
  const { page, limit, status } = options;
  const skip = (page - 1) * limit;
  const where = status ? { status } : {};

  const [requests, total] = await Promise.all([
    prisma.kundaliMatchRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        reviewedByAdmin: { select: { id: true, name: true } },
      },
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
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      reviewedByAdmin: { select: { id: true, name: true } },
    },
  });
  return updated as KundaliMatchRequestRow;
}
