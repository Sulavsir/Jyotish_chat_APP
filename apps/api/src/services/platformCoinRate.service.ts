/**
 * Platform Coin Rate Service
 * Admin-configurable coin rates for chat, broadcast, appointment
 */

import { prisma } from '@jyotish/database';
import type { PlatformCoinRateType } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';

export interface PlatformCoinRateRow {
  id: string;
  rateType: PlatformCoinRateType;
  coins: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdatePlatformCoinRatesInput {
  CHAT_PER_MESSAGE?: number;
  BROADCAST_PER_MESSAGE?: number;
  BROADCAST_SEND?: number;
  APPOINTMENT?: number;
  KUNDALI_REVIEW?: number;
  KUNDALI_MATCH?: number;
}

const RATE_TYPES: PlatformCoinRateType[] = [
  'CHAT_PER_MESSAGE',
  'BROADCAST_PER_MESSAGE',
  'BROADCAST_SEND',
  'APPOINTMENT',
  'KUNDALI_REVIEW',
  'KUNDALI_MATCH',
];

/**
 * Get coin rate for a single rate type (with fallback for missing rows)
 */
export async function getRate(rateType: PlatformCoinRateType): Promise<number> {
  const row = await prisma.platformCoinRate.findUnique({
    where: { rateType },
    select: { coins: true },
  });
  if (!row) {
    // Fallback defaults when admin has not set rates
    const defaults: Record<PlatformCoinRateType, number> = {
      CHAT_PER_MESSAGE: 200,
      BROADCAST_PER_MESSAGE: 100,
      BROADCAST_SEND: 100,
      APPOINTMENT: 300,
      KUNDALI_REVIEW: 500,
      KUNDALI_MATCH: 0,
    };
    return defaults[rateType] ?? 0;
  }
  return row.coins;
}

/**
 * Get platform coin rates as a simple map (for client display / pre-checks)
 * Uses same fallback defaults as getRate when a row is missing.
 */
export async function getRatesForClient(): Promise<
  Record<PlatformCoinRateType, number>
> {
  const [chat, broadcastMsg, broadcastSend, appointment, kundaliReview, kundaliMatch] =
    await Promise.all([
      getRate('CHAT_PER_MESSAGE'),
      getRate('BROADCAST_PER_MESSAGE'),
      getRate('BROADCAST_SEND'),
      getRate('APPOINTMENT'),
      getRate('KUNDALI_REVIEW'),
      getRate('KUNDALI_MATCH'),
    ]);
  return {
    CHAT_PER_MESSAGE: chat,
    BROADCAST_PER_MESSAGE: broadcastMsg,
    BROADCAST_SEND: broadcastSend,
    APPOINTMENT: appointment,
    KUNDALI_REVIEW: kundaliReview,
    KUNDALI_MATCH: kundaliMatch,
  };
}

/**
 * Get all platform coin rates (for admin table)
 */
export async function getAllRates(): Promise<PlatformCoinRateRow[]> {
  const rows = await prisma.platformCoinRate.findMany({
    orderBy: { rateType: 'asc' },
  });
  // Ensure all rate types exist (upsert missing)
  const existing = new Set(rows.map((r) => r.rateType));
  const defaultCoins: Record<PlatformCoinRateType, number> = {
    CHAT_PER_MESSAGE: 200,
    BROADCAST_PER_MESSAGE: 100,
    BROADCAST_SEND: 100,
    APPOINTMENT: 300,
    KUNDALI_REVIEW: 500,
    KUNDALI_MATCH: 0,
  };
  for (const rateType of RATE_TYPES) {
    if (!existing.has(rateType)) {
      const created = await prisma.platformCoinRate.create({
        data: {
          rateType,
          coins: defaultCoins[rateType],
          description: null,
        },
      });
      rows.push(created);
      existing.add(rateType);
    }
  }
  return rows.sort(
    (a, b) => RATE_TYPES.indexOf(a.rateType) - RATE_TYPES.indexOf(b.rateType)
  );
}

/**
 * Update one or more coin rates (admin only)
 */
export async function updateRates(
  input: UpdatePlatformCoinRatesInput
): Promise<PlatformCoinRateRow[]> {
  const updates = Object.entries(input).filter(
    (e): e is [PlatformCoinRateType, number] =>
      RATE_TYPES.includes(e[0] as PlatformCoinRateType) &&
      typeof e[1] === 'number' &&
      e[1] >= 0
  );
  if (updates.length === 0) {
    throw new AppError(
      'No valid rate updates provided',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  await prisma.$transaction(
    updates.map(([rateType, coins]) =>
      prisma.platformCoinRate.upsert({
        where: { rateType },
        create: { rateType, coins, description: null },
        update: { coins },
      })
    )
  );
  return getAllRates();
}
