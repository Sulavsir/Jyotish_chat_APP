/**
 * GET /api/v1/appointments/booking-quote
 */

export type BookingQuoteBookingType = 'KUNDALI_REVIEW';

export interface BookingQuoteResponse {
  astrologerId: string;
  bookingType: BookingQuoteBookingType;
  slotId: string | null;
  totalNr: number;
  balance: number;
  remainingNr: number;
  appointmentFee: number;
  kundaliReviewCommissionPercent: number;
  appointmentCommissionPercent: number;
  estimatedJyotishBalanceEarned: number;
}

export interface GetBookingQuoteParams {
  astrologerId: string;
  bookingType: BookingQuoteBookingType;
  slotId?: string;
}
