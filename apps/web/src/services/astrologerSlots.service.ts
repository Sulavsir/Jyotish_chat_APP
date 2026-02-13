/**
 * Astrologer Slots Service (Jyotish manages own slots for appointment / kundali review)
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api.constants';
import type { AstrologerSlot, BookingType } from '@/types/appointment.types';

export interface ListMySlotsParams {
  slotType?: BookingType;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

export interface ListMySlotsResult {
  slots: AstrologerSlot[];
  total: number;
}

export interface CreateSlotBody {
  startAt: string; // ISO datetime
  endAt: string;
  slotType: BookingType;
}

export interface UpdateSlotBody {
  startAt: string; // ISO datetime
  endAt: string;
}

export async function listMySlots(
  params?: ListMySlotsParams
): Promise<ListMySlotsResult> {
  return apiClient.get<ListMySlotsResult>(API_ENDPOINTS.ASTROLOGER.SLOTS, { params });
}

export async function createSlot(body: CreateSlotBody): Promise<{ slot: AstrologerSlot }> {
  return apiClient.post<{ slot: AstrologerSlot }>(API_ENDPOINTS.ASTROLOGER.SLOTS, body);
}

export async function updateSlot(
  id: string,
  body: UpdateSlotBody
): Promise<{ slot: AstrologerSlot }> {
  return apiClient.patch<{ slot: AstrologerSlot }>(API_ENDPOINTS.ASTROLOGER.SLOT_BY_ID(id), body);
}

export async function deleteSlot(id: string): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>(API_ENDPOINTS.ASTROLOGER.SLOT_BY_ID(id));
}
