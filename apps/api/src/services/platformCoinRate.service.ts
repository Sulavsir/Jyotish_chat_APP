/**
 * Platform Coin Rate Service
 * Admin-configurable coin rates for chat, broadcast, appointment
 */

import { prisma } from '@jyotish/database';
import type { PlatformCoinRateType } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';

// ─── In-process rate cache (TTL: 60 s) ──────────────────────────────────────
// Rates are admin-set and rarely change. Caching avoids a DB round-trip on
// every single message send / broadcast creation / dashboard load.
const CACHE_TTL_MS = 60_000;
let rateCache: Map<PlatformCoinRateType, number> | null = null;
let rateCacheAt = 0;

function getCachedRate(rateType: PlatformCoinRateType): number | undefined {
  if (!rateCache || Date.now() - rateCacheAt > CACHE_TTL_MS) return undefined;
  return rateCache.get(rateType);
}

function setCachedRate(rateType: PlatformCoinRateType, value: number) {
  if (!rateCache) rateCache = new Map();
  rateCache.set(rateType, value);
  rateCacheAt = Date.now();
}

/** Invalidate the entire rate cache (call after admin updates rates). */
export function invalidateRateCache() {
  rateCache = null;
  rateCacheAt = 0;
}

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
  COINS_PER_NPR?: number;
   FIRST_BROADCAST_DISCOUNT?: number;
}

/** All platform coin rate types (must match Prisma enum PlatformCoinRateType). */
const RATE_TYPES: PlatformCoinRateType[] = [
  'CHAT_PER_MESSAGE',
  'BROADCAST_PER_MESSAGE',
  'BROADCAST_SEND',
  'APPOINTMENT',
  'KUNDALI_REVIEW',
  'KUNDALI_MATCH',
  'COINS_PER_NPR' as PlatformCoinRateType,
  'FIRST_BROADCAST_DISCOUNT' as PlatformCoinRateType,
];

const RATE_DEFAULTS: Record<string, number> = {
  CHAT_PER_MESSAGE: 200,
  BROADCAST_PER_MESSAGE: 100,
  BROADCAST_SEND: 100,
  APPOINTMENT: 300,
  KUNDALI_REVIEW: 500,
  KUNDALI_MATCH: 0,
  COINS_PER_NPR: 1,
  FIRST_BROADCAST_DISCOUNT: 0,
};

/**
 * Get coin rate for a single rate type (with fallback for missing rows).
 * Results are cached in-process for 60 s to avoid a DB round-trip on
 * every message send / broadcast creation.
 */
export async function getRate(rateType: PlatformCoinRateType): Promise<number> {
  const cached = getCachedRate(rateType);
  if (cached !== undefined) return cached;

  const row = await prisma.platformCoinRate.findUnique({
    where: { rateType },
    select: { coins: true },
  });
  const value = row?.coins ?? (RATE_DEFAULTS[rateType as string] ?? 0);
  setCachedRate(rateType, value);
  return value;
}

/**
 * Get platform coin rates as a simple map (for client display / pre-checks)
 * Uses same fallback defaults as getRate when a row is missing.
 *
 * **Important for mobile clients:** `COINS_PER_NPR` is often **1** (1 coin = 1 NPR). It is **not**
 * the per-message chat fee. Use `CHAT_PER_MESSAGE` / `BROADCAST_PER_MESSAGE` for bundle pricing UI.
 */
export async function getRatesForClient(): Promise<
  Record<PlatformCoinRateType, number>
> {
  const [chat, broadcastMsg, broadcastSend, appointment, kundaliReview, kundaliMatch, coinsPerNpr] =
    await Promise.all([
      getRate('CHAT_PER_MESSAGE'),
      getRate('BROADCAST_PER_MESSAGE'),
      getRate('BROADCAST_SEND'),
      getRate('APPOINTMENT'),
      getRate('KUNDALI_REVIEW'),
      getRate('KUNDALI_MATCH'),
      getRate('COINS_PER_NPR' as PlatformCoinRateType),
    ]);
  return {
    CHAT_PER_MESSAGE: chat,
    BROADCAST_PER_MESSAGE: broadcastMsg,
    BROADCAST_SEND: broadcastSend,
    APPOINTMENT: appointment,
    KUNDALI_REVIEW: kundaliReview,
    KUNDALI_MATCH: kundaliMatch,
    COINS_PER_NPR: coinsPerNpr,
    FIRST_BROADCAST_DISCOUNT: await getRate('FIRST_BROADCAST_DISCOUNT' as PlatformCoinRateType),
  } as Record<PlatformCoinRateType, number>;
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
  for (const rateType of RATE_TYPES) {
    if (!existing.has(rateType)) {
      const created = await prisma.platformCoinRate.create({
        data: {
          rateType,
          coins: RATE_DEFAULTS[rateType] ?? 0,
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
  // Invalidate cache so next getRate() fetches fresh values
  invalidateRateCache();
  return getAllRates();
}
