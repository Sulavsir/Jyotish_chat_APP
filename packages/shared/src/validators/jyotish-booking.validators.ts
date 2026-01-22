import { z } from 'zod';
import { JyotishBookingStatus, JyotishBookingType } from '../types';
import {
  KATHA_VACHAK_BOOKING_CATEGORIES,
  PANDIT_BOOKING_CATEGORIES,
  VAASTU_BOOKING_CATEGORIES,
} from '../constants';

const isValidISODate = (value: string) => {
  // HTML date input sends YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime());
};

export const createJyotishBookingRequestSchema = z
  .object({
    type: z.nativeEnum(JyotishBookingType),
    preferredAstrologerId: z.string().uuid('Invalid astrologer selection').optional(),
    bookingDate: z
      .string()
      .min(1, 'Booking date is required')
      .refine(isValidISODate, 'Booking date must be a valid date (YYYY-MM-DD)'),
    category: z.string().min(1, 'Category is required'),
    details: z.string().max(2000, 'Details is too long').optional(),
    location: z.string().min(1, 'Location is required').max(500, 'Location is too long'),
  })
  .superRefine((data, ctx) => {
    // Only Katha Vachak bookings can/should select a specific astrologer.
    if (data.type === JyotishBookingType.KATHA_VACHAK && !data.preferredAstrologerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select a Jyotish',
        path: ['preferredAstrologerId'],
      });
    }

    // Pandit/Vaastu bookings should NOT include preferred astrologer selection.
    if (data.type !== JyotishBookingType.KATHA_VACHAK && data.preferredAstrologerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Preferred Jyotish selection is only allowed for Katha Vachak bookings',
        path: ['preferredAstrologerId'],
      });
    }

    const allowedByType: Record<JyotishBookingType, readonly string[]> = {
      [JyotishBookingType.PANDIT]: PANDIT_BOOKING_CATEGORIES,
      [JyotishBookingType.VAASTU]: VAASTU_BOOKING_CATEGORIES,
      [JyotishBookingType.KATHA_VACHAK]: KATHA_VACHAK_BOOKING_CATEGORIES,
    };

    const allowed = allowedByType[data.type] ?? [];

    const isAllowed = (allowed as readonly string[]).includes(data.category);
    if (!isAllowed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid category for selected booking type',
        path: ['category'],
      });
    }
  });

export const adminUpdateJyotishBookingStatusSchema = z.object({
  status: z.nativeEnum(JyotishBookingStatus),
  adminNotes: z.string().max(1000, 'Admin notes is too long').optional(),
});

