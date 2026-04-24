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

const bookingContactPhoneSchema = z
  .string()
  .min(1, 'Contact number is required')
  .max(22)
  .transform((s) => s.trim().replace(/\s+/g, ''))
  .refine((s) => {
    const digits = s.startsWith('+') ? s.slice(1) : s;
    return /^[0-9]{9,15}$/.test(digits);
  }, 'Enter a valid phone number');

const bookingContactPhoneAltSchema = z.preprocess(
  (v) => {
    if (v == null || v === '') return undefined;
    if (typeof v !== 'string') return undefined;
    return v.trim() === '' ? undefined : v;
  },
  bookingContactPhoneSchema.optional()
);

const optionalGoogleMapLinkSchema = z.preprocess(
  (v) => {
    if (v == null || v === '') return undefined;
    if (typeof v !== 'string') return undefined;
    const t = v.trim();
    return t === '' ? undefined : t;
  },
  z.string().url('Invalid Google Maps link').max(2048).optional()
);

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
    province: z.string().min(1, 'Province is required').max(120, 'Province is too long'),
    district: z.string().min(1, 'District is required').max(120, 'District is too long'),
    wardNo: z
      .string()
      .max(30, 'Ward number is too long')
      .transform((s) => s.trim())
      .refine((s) => s.length > 0, 'Ward number is required')
      .refine((s) => /^\d+$/.test(s), 'Ward number must be a whole number')
      .refine((s) => {
        const n = parseInt(s, 10);
        return Number.isFinite(n) && n >= 1;
      }, 'Ward number must be at least 1'),
    place: z.string().min(1, 'Place is required').max(200, 'Place is too long'),
    tole: z.string().max(200, 'Tole is too long').optional(),
    nearestLandmark: z.string().max(300, 'Nearest landmark is too long').optional(),
    googleMapLink: optionalGoogleMapLinkSchema,
    pujariCount: z.coerce.number().int().min(1, 'At least one Pujari is required').max(50),
    contactPhone: bookingContactPhoneSchema,
    contactPhoneAlt: bookingContactPhoneAltSchema,
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

    if (data.type === JyotishBookingType.PANDIT) {
      if (!data.category || data.category.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Category is required',
          path: ['category'],
        });
      }
    } else {
      const allowedByType: Partial<Record<JyotishBookingType, readonly string[]>> = {
        [JyotishBookingType.VAASTU]: VAASTU_BOOKING_CATEGORIES,
        [JyotishBookingType.KATHA_VACHAK]: KATHA_VACHAK_BOOKING_CATEGORIES,
      };

      const allowed = allowedByType[data.type];
      if (allowed) {
        const isAllowed = (allowed as readonly string[]).includes(data.category);
        if (!isAllowed) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid category for selected booking type',
            path: ['category'],
          });
        }
      }
    }

    const alt = data.contactPhoneAlt;
    if (alt && alt === data.contactPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Alternative number must differ from the primary contact number',
        path: ['contactPhoneAlt'],
      });
    }
  });

export const adminUpdateJyotishBookingStatusSchema = z.object({
  status: z.nativeEnum(JyotishBookingStatus),
  adminNotes: z.string().max(1000, 'Admin notes is too long').optional(),
});

export type CreateJyotishBookingRequestInput = z.infer<typeof createJyotishBookingRequestSchema>;
