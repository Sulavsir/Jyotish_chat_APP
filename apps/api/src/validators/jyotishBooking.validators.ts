import { z } from 'zod';
import { JyotishBookingStatus, JyotishBookingType } from '@jyotish/database';
import { queryPaginationSchema } from './query.validators';

export const listMyJyotishBookingsQuerySchema = queryPaginationSchema.extend({
  search: z.string().trim().min(1).optional(),
  type: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return val === JyotishBookingType.PANDIT ||
        val === JyotishBookingType.VAASTU ||
        val === JyotishBookingType.KATHA_VACHAK
        ? (val as JyotishBookingType)
        : undefined;
    }),
  status: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return val === JyotishBookingStatus.PENDING ||
        val === JyotishBookingStatus.APPROVED ||
        val === JyotishBookingStatus.REJECTED
        ? (val as JyotishBookingStatus)
        : undefined;
    }),
});

export const listAdminJyotishBookingsQuerySchema = queryPaginationSchema.extend({
  search: z.string().trim().min(1).optional(),
  type: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return val === JyotishBookingType.PANDIT ||
        val === JyotishBookingType.VAASTU ||
        val === JyotishBookingType.KATHA_VACHAK
        ? (val as JyotishBookingType)
        : undefined;
    }),
  status: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return val === JyotishBookingStatus.PENDING ||
        val === JyotishBookingStatus.APPROVED ||
        val === JyotishBookingStatus.REJECTED
        ? (val as JyotishBookingStatus)
        : undefined;
    }),
});

