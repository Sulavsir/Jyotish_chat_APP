/**
 * Quote for slot-based appointment booking (balance check before deduct).
 * Fee = astrologer's appointmentFee; kundali commission % is admin-set per Jyotish.
 */

import { prisma } from '@jyotish/database';
import { ACTIVE_CLIENT_USER_WHERE } from '../constants/user.constants';
import { SlotStatus } from '@prisma/client';
import { AstrologerCategory } from '@jyotish/shared';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { astrologerCoinsFromClientDeduction } from '../utils/astrologer-coin-earning.util';

export type BookingQuoteBookingType = 'KUNDALI_REVIEW';

export interface GetBookingQuoteInput {
  astrologerId: string;
  bookingType: BookingQuoteBookingType;
  slotId?: string;
}

export interface BookingQuoteResult {
  astrologerId: string;
  bookingType: BookingQuoteBookingType;
  slotId: string | null;
  totalNr: number;
  balance: number;
  remainingNr: number;
  appointmentFee: number;
  kundaliReviewCommissionPercent: number;
  appointmentCommissionPercent: number;
  /** Preview of Jyotish balance credit for this booking (NRs), using kundali % for KUNDALI_REVIEW */
  estimatedJyotishBalanceEarned: number;
}

export async function getBookingQuote(
  clientId: string,
  input: GetBookingQuoteInput
): Promise<BookingQuoteResult> {
  const { astrologerId, bookingType, slotId } = input;

  const astrologer = await prisma.astrologer.findUnique({
    where: { id: astrologerId },
    select: {
      id: true,
      isActive: true,
      category: true,
      appointmentFee: true,
      kundaliReviewCommissionPercent: true,
      appointmentCommissionPercent: true,
    },
  });

  if (!astrologer || !astrologer.isActive) {
    throw new AppError('Astrologer not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  if (astrologer.category === AstrologerCategory.ORDINARY) {
    throw new AppError(
      'This astrologer does not accept appointments',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const appointmentFee = Math.max(0, Math.ceil(Number(astrologer.appointmentFee ?? 0)));
  const totalNr = appointmentFee;

  if (slotId) {
    const slot = await prisma.astrologerSlot.findUnique({
      where: { id: slotId },
      select: {
        id: true,
        astrologerId: true,
        status: true,
        slotType: true,
      },
    });
    if (!slot) {
      throw new AppError('Slot not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    if (slot.astrologerId !== astrologerId) {
      throw new AppError(
        'Slot does not belong to this astrologer',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    if (slot.status !== SlotStatus.AVAILABLE) {
      throw new AppError(
        'This slot is no longer available',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    if (slot.slotType !== bookingType) {
      throw new AppError(
        'Slot type does not match booking type',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
  }

  const user = await prisma.user.findFirst({
    where: { id: clientId, ...ACTIVE_CLIENT_USER_WHERE },
    select: { coins: true },
  });
  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  const balance = user.coins;
  const remainingNr = Math.max(0, totalNr - balance);

  const kPct = astrologer.kundaliReviewCommissionPercent ?? 0;
  const aPct = astrologer.appointmentCommissionPercent ?? 0;
  const pctForKundali = bookingType === 'KUNDALI_REVIEW' ? kPct : aPct;
  const estimatedJyotishBalanceEarned =
    totalNr > 0 && pctForKundali > 0
      ? astrologerCoinsFromClientDeduction(totalNr, pctForKundali)
      : 0;

  return {
    astrologerId,
    bookingType,
    slotId: slotId ?? null,
    totalNr,
    balance,
    remainingNr,
    appointmentFee,
    kundaliReviewCommissionPercent: kPct,
    appointmentCommissionPercent: aPct,
    estimatedJyotishBalanceEarned,
  };
}
