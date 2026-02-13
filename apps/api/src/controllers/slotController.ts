/**
 * Slot Controller
 * Client: list available slots for an astrologer. Astrologer: CRUD own slots.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/common.types';
import * as astrologerSlotService from '../services/astrologerSlot.service';
import { HTTP_STATUS } from '../constants';
import { sendSuccess, sendError } from '../utils';
import { SlotType } from '@prisma/client';

/**
 * List available slots for an astrologer (client booking flow).
 * GET /api/v1/appointments/slots/:astrologerId?slotType=APPOINTMENT|KUNDALI_REVIEW&fromDate=&toDate=
 */
export async function listAvailableSlots(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
  const { astrologerId } = req.params;
  const { slotType, fromDate, toDate } = req.query as {
    slotType?: string;
    fromDate?: string;
    toDate?: string;
  };
  if (!slotType || !['APPOINTMENT', 'KUNDALI_REVIEW'].includes(slotType)) {
    sendError(res, 'slotType is required (APPOINTMENT or KUNDALI_REVIEW)', HTTP_STATUS.BAD_REQUEST);
    return;
  }
  const slots = await astrologerSlotService.listAvailableForClient({
    astrologerId,
    slotType: slotType as SlotType,
    fromDate: fromDate ? new Date(fromDate + 'T00:00:00.000Z') : undefined,
    toDate: toDate ? new Date(toDate + 'T23:59:59.999Z') : undefined,
  });
  sendSuccess(res, { slots });
}

/**
 * List my slots (astrologer only). Paginated.
 * GET /api/v1/astrologer/slots?slotType=&fromDate=&toDate=&limit=20&offset=0
 */
export async function listMySlots(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
  const astrologerId = req.user!.id;
  const { slotType, fromDate, toDate, limit, offset } = req.query as {
    slotType?: string;
    fromDate?: string;
    toDate?: string;
    limit?: string;
    offset?: string;
  };
  const result = await astrologerSlotService.listByAstrologer(astrologerId, {
    slotType: slotType as SlotType | undefined,
    fromDate: fromDate ? new Date(fromDate + 'T00:00:00.000Z') : undefined,
    toDate: toDate ? new Date(toDate + 'T23:59:59.999Z') : undefined,
    limit: limit != null ? parseInt(limit, 10) : undefined,
    offset: offset != null ? parseInt(offset, 10) : undefined,
  });
  sendSuccess(res, { slots: result.slots, total: result.total });
}

/**
 * Create a slot (astrologer only).
 * POST /api/v1/astrologer/slots
 */
export async function createSlot(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
  const astrologerId = req.user!.id;
  const { startAt, endAt, slotType } = req.body;
  const slot = await astrologerSlotService.createSlot({
    astrologerId,
    startAt: new Date(startAt),
    endAt: new Date(endAt),
    slotType,
  });
  sendSuccess(res, { slot }, HTTP_STATUS.CREATED);
}

/**
 * Update a slot (astrologer only). Only AVAILABLE slots; booked slots cannot be edited.
 * PATCH /api/v1/astrologer/slots/:id
 */
export async function updateSlot(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
  const astrologerId = req.user!.id;
  const { id } = req.params;
  const { startAt, endAt } = req.body;
  const slot = await astrologerSlotService.updateSlot(id, astrologerId, {
    startAt: new Date(startAt),
    endAt: new Date(endAt),
  });
  sendSuccess(res, { slot });
}

/**
 * Delete a slot (astrologer only). Only AVAILABLE slots.
 * DELETE /api/v1/astrologer/slots/:id
 */
export async function deleteSlot(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
  const astrologerId = req.user!.id;
  const { id } = req.params;
  await astrologerSlotService.deleteSlot(id, astrologerId);
  sendSuccess(res, { message: 'Slot deleted' });
}
