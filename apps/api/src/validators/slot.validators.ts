/**
 * Slot Validators
 */

import { z } from 'zod';

const slotTypeEnum = z.enum(['KUNDALI_REVIEW']);
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

const SLOT_DURATION_MINUTES = 30;

export const createSlotSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  slotType: slotTypeEnum,
})
  .refine((data) => new Date(data.startAt) < new Date(data.endAt), {
    message: 'startAt must be before endAt',
    path: ['endAt'],
  })
  .refine((data) => {
    const start = new Date(data.startAt).getTime();
    const end = new Date(data.endAt).getTime();
    const diffMinutes = (end - start) / (60 * 1000);
    return Math.abs(diffMinutes - SLOT_DURATION_MINUTES) < 1;
  }, { message: `Slot must be exactly ${SLOT_DURATION_MINUTES} minutes`, path: ['endAt'] });

/** Bulk create: body is { slots: CreateSlotBody[] } */
export const createSlotsBulkSchema = z.object({
  slots: z.array(createSlotSchema).min(1, 'At least one slot is required').max(50, 'At most 50 slots per request'),
});

export const updateSlotSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
})
  .refine((data) => new Date(data.startAt) < new Date(data.endAt), {
    message: 'startAt must be before endAt',
    path: ['endAt'],
  })
  .refine((data) => {
    const start = new Date(data.startAt).getTime();
    const end = new Date(data.endAt).getTime();
    const diffMinutes = (end - start) / (60 * 1000);
    return Math.abs(diffMinutes - SLOT_DURATION_MINUTES) < 1;
  }, { message: `Slot must be exactly ${SLOT_DURATION_MINUTES} minutes`, path: ['endAt'] });

const limitSchema = z.coerce.number().int().min(1).max(100).optional().default(20);
const offsetSchema = z.coerce.number().int().min(0).optional().default(0);

export const listSlotsQuerySchema = z.object({
  slotType: slotTypeEnum.optional(),
  fromDate: dateOnly.optional(),
  toDate: dateOnly.optional(),
  limit: limitSchema,
  offset: offsetSchema,
});

export const listAvailableSlotsQuerySchema = z.object({
  slotType: slotTypeEnum,
  fromDate: dateOnly.optional(),
  toDate: dateOnly.optional(),
});
