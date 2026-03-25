/**
 * Session storage for resuming Full Kundali slot booking after wallet top-up.
 */

export const PENDING_KUNDALI_BOOKING_KEY = 'pendingKundaliBooking';

export interface PendingKundaliBookingPayload {
  astrologerId: string;
  slotId: string;
  bookingType: 'KUNDALI_REVIEW';
  notes?: string;
  totalNr: number;
}

export function storePendingKundaliBooking(payload: PendingKundaliBookingPayload): void {
  try {
    sessionStorage.setItem(PENDING_KUNDALI_BOOKING_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function getPendingKundaliBooking(): PendingKundaliBookingPayload | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KUNDALI_BOOKING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingKundaliBookingPayload;
    if (!parsed?.astrologerId || !parsed?.slotId || parsed.bookingType !== 'KUNDALI_REVIEW') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingKundaliBooking(): void {
  try {
    sessionStorage.removeItem(PENDING_KUNDALI_BOOKING_KEY);
  } catch {
    // ignore
  }
}
