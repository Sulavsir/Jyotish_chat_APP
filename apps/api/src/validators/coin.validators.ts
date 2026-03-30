/**
 * Coin Validators
 * Validation schemas for coin-related operations
 */

import { z } from 'zod';
import { parseEarningsDateQueryParam } from '../utils/date-query.utils';

/**
 * Validator for adding coins
 */
export const addCoinsSchema = z
  .object({
    amount: z
      .number({
        invalid_type_error: 'Amount must be a number',
      })
      .int('Amount must be an integer')
      .nonnegative('Amount must be 0 or greater')
      .max(10000, 'Amount cannot exceed 10000 coins')
      .optional(),
    paymentId: z.string().uuid('Invalid payment ID').optional(),
    planId: z.string().uuid('Invalid plan ID').optional(),
  })
  .refine(
    (data) => {
      // Either amount (for direct coin addition) or planId (for plan activation) must be provided
      return (data.amount !== undefined && data.amount > 0) || !!data.planId;
    },
    {
      message: 'Either amount (for direct coin addition) or planId (for plan activation) must be provided',
    }
  );

/**
 * Validator for admin adding coins to user
 */
export const adminAddCoinsSchema = z.object({
  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    })
    .int('Amount must be an integer')
    .positive('Amount must be greater than 0')
    .max(10000, 'Amount cannot exceed 10000 coins'),
  reason: z.string().max(200, 'Reason cannot exceed 200 characters').optional(),
});

/**
 * Transaction filter: payment_success | admin_added | app_used
 * - payment_success: ADD + PAYMENT_SUCCESS
 * - admin_added: ADD + ADMIN_ADJUSTMENT
 * - app_used: DEDUCT (chat, broadcast, purchase, etc.)
 */
export const transactionFilterSchema = z
  .enum(['payment_success', 'admin_added', 'app_used'])
  .optional();

/**
 * Validator for transaction history query parameters
 */
export const transactionHistoryQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().int().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0)),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1)),
  filter: transactionFilterSchema,
});

const coinRateValue = z.number().int().min(0).max(10000);
const percentageValue = z.number().int().min(0).max(100);

/**
 * Validator for admin updating platform coin rates
 */
export const updatePlatformCoinRatesSchema = z
  .object({
    CHAT_PER_MESSAGE: coinRateValue.optional(),
    BROADCAST_PER_MESSAGE: coinRateValue.optional(),
    BROADCAST_SEND: coinRateValue.optional(),
    APPOINTMENT: coinRateValue.optional(),
    KUNDALI_REVIEW: coinRateValue.optional(),
    KUNDALI_MATCH: coinRateValue.optional(),
    COINS_PER_NPR: coinRateValue.optional(),
    FIRST_BROADCAST_DISCOUNT: percentageValue.optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one rate must be provided',
  });

/**
 * Validator for astrologer earnings list query
 * `from` / `to` as YYYY-MM-DD use inclusive UTC day range (see parseEarningsDateQueryParam).
 */
export const getAstrologerEarningsQuerySchema = z.object({
  from: z
    .string()
    .optional()
    .transform((val) => parseEarningsDateQueryParam(val, 'start')),
  to: z
    .string()
    .optional()
    .transform((val) => parseEarningsDateQueryParam(val, 'end')),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().int().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0)),
  source: z
    .enum(['CHAT_MESSAGE', 'BROADCAST_MESSAGE', 'APPOINTMENT', 'KUNDALI_REVIEW'])
    .optional(),
});

export type GetAstrologerEarningsQuery = z.infer<typeof getAstrologerEarningsQuerySchema>;

/**
 * Validator for admin list astrologers with coin earnings query
 */
export const listAstrologersWithCoinEarningsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 10))
    .pipe(z.number().int().min(1).max(100)),
  search: z.string().optional(),
});
