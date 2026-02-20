/**
 * Astrologer Slot Service
 * Jyotish-defined time slots for appointment and kundali review booking.
 * All slots are exactly 30 minutes. Client cannot book same-day slots.
 */

import { prisma } from '@jyotish/database';
import { SlotType, SlotStatus, Prisma } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { SLOT_DURATION_MINUTES } from '../constants/astrologer.constants';
import type { AstrologerSlotRow } from '../types/appointment.types';

export function getSlotDurationMs(): number {
  return SLOT_DURATION_MINUTES * 60 * 1000;
}

export interface UpdateSlotInput {
  startAt: Date;
  endAt: Date;
}

export interface ListSlotsForClientInput {
  astrologerId: string;
  slotType: SlotType;
  fromDate?: Date;
  toDate?: Date;
}

/** Start of next calendar day (UTC) so client cannot book same-day slots. */
function startOfNextDay(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

/**
 * Create multiple slots (astrologer only). Creates in order; validation per slot.
 */
export async function createSlotsBulk(
  astrologerId: string,
  items: Array<{ startAt: string; endAt: string; slotType: SlotType }>
): Promise<AstrologerSlotRow[]> {
  const astrologer = await prisma.astrologer.findUnique({
    where: { id: astrologerId },
    select: { id: true, category: true },
  });
  if (!astrologer) {
    throw new AppError('Astrologer not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  const now = new Date();
  const expectedDurationMs = getSlotDurationMs();
  const created: AstrologerSlotRow[] = [];

  for (const item of items) {
    const startAt = new Date(item.startAt);
    const endAt = new Date(item.endAt);
    const durationMs = endAt.getTime() - startAt.getTime();

    if (Math.abs(durationMs - expectedDurationMs) > 60 * 1000) {
      throw new AppError(
        `Slot duration must be exactly ${SLOT_DURATION_MINUTES} minutes`,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    if (startAt >= endAt) {
      throw new AppError(
        'Slot start must be before end',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    if (startAt < now) {
      throw new AppError(
        'Slot start must be in the future',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const slot = await prisma.astrologerSlot.create({
      data: {
        astrologerId,
        startAt,
        endAt,
        slotType: item.slotType,
        status: SlotStatus.AVAILABLE,
      },
    });
    created.push(slot as AstrologerSlotRow);
  }

  return created;
}

export interface ListByAstrologerOptions {
  slotType?: SlotType;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ListByAstrologerResult {
  slots: AstrologerSlotRow[];
  total: number;
}

/**
 * List slots for an astrologer (own slots, for management). Supports pagination.
 */
export async function listByAstrologer(
  astrologerId: string,
  options: ListByAstrologerOptions = {}
): Promise<ListByAstrologerResult> {
  const { limit = 20, offset = 0 } = options;
  const where: Prisma.AstrologerSlotWhereInput = {
    astrologerId,
  };
  if (options.slotType) where.slotType = options.slotType;
  if (options.fromDate || options.toDate) {
    where.startAt = {};
    if (options.fromDate) where.startAt.gte = options.fromDate;
    if (options.toDate) where.startAt.lte = options.toDate;
  }

  const [slots, total] = await Promise.all([
    prisma.astrologerSlot.findMany({
      where,
      orderBy: { startAt: 'asc' },
      take: Math.min(100, Math.max(1, limit)),
      skip: Math.max(0, offset),
    }),
    prisma.astrologerSlot.count({ where }),
  ]);
  return { slots: slots as AstrologerSlotRow[], total };
}

/**
 * List available slots for a client (to book). Only AVAILABLE; startAt must be on or after start of next day (no same-day booking).
 */
export async function listAvailableForClient(
  input: ListSlotsForClientInput
): Promise<AstrologerSlotRow[]> {
  const { astrologerId, slotType, fromDate, toDate } = input;
  const nextDayStart = startOfNextDay();
  const minStart =
    fromDate && new Date(fromDate) > nextDayStart ? new Date(fromDate) : nextDayStart;
  const where: Prisma.AstrologerSlotWhereInput = {
    astrologerId,
    slotType,
    status: SlotStatus.AVAILABLE,
    startAt: {
      gte: minStart,
      ...(toDate ? { lte: new Date(toDate) } : {}),
    },
  };

  const slots = await prisma.astrologerSlot.findMany({
    where,
    orderBy: { startAt: 'asc' },
  });
  return slots as AstrologerSlotRow[];
}

/**
 * Get a slot by ID.
 */
export async function getSlotById(id: string): Promise<AstrologerSlotRow | null> {
  const slot = await prisma.astrologerSlot.findUnique({
    where: { id },
  });
  return slot as AstrologerSlotRow | null;
}

/**
 * Update a slot (astrologer only). Only AVAILABLE slots can be updated; duration must remain 30 minutes.
 */
export async function updateSlot(
  id: string,
  astrologerId: string,
  input: UpdateSlotInput
): Promise<AstrologerSlotRow> {
  const slot = await prisma.astrologerSlot.findFirst({
    where: { id, astrologerId },
  });
  if (!slot) {
    throw new AppError('Slot not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  if (slot.status !== SlotStatus.AVAILABLE) {
    throw new AppError(
      'Only available slots can be edited. Booked slots cannot be changed.',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  const { startAt, endAt } = input;
  const now = new Date();
  const durationMs = endAt.getTime() - startAt.getTime();
  if (Math.abs(durationMs - getSlotDurationMs()) > 60 * 1000) {
    throw new AppError(
      `Slot duration must be exactly ${SLOT_DURATION_MINUTES} minutes`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  if (startAt >= endAt || startAt < now) {
    throw new AppError(
      'Slot must start in the future and end after start',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  const updated = await prisma.astrologerSlot.update({
    where: { id },
    data: { startAt, endAt },
  });
  return updated as AstrologerSlotRow;
}

/**
 * Delete a slot (astrologer only). Only AVAILABLE slots can be deleted.
 */
export async function deleteSlot(id: string, astrologerId: string): Promise<void> {
  const slot = await prisma.astrologerSlot.findFirst({
    where: { id, astrologerId },
  });
  if (!slot) {
    throw new AppError('Slot not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  if (slot.status !== SlotStatus.AVAILABLE) {
    throw new AppError(
      'Only available slots can be deleted',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }
  await prisma.astrologerSlot.delete({ where: { id } });
}
