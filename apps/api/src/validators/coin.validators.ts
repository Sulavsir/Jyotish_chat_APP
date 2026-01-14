/**
 * Coin Validators
 * Validation schemas for coin-related operations
 */

import { z } from 'zod';

/**
 * Validator for adding coins
 */
export const addCoinsSchema = z.object({
  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    })
    .int('Amount must be an integer')
    .positive('Amount must be greater than 0')
    .max(10000, 'Amount cannot exceed 10000 coins'),
  paymentId: z.string().uuid('Invalid payment ID').optional(),
});

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
});
