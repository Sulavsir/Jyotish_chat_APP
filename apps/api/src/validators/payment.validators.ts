/**
 * Payment validators (GetPay order and verify)
 */

import { z } from 'zod';

export const createOrderSchema = z.object({
  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    })
    .positive('Amount must be greater than 0')
    .max(1_000_000, 'Amount must not exceed 1,000,000'),
  coins: z
    .number({
      required_error: 'Coins is required',
      invalid_type_error: 'Coins must be a number',
    })
    .int('Coins must be an integer')
    .nonnegative('Coins must be 0 or greater')
    .max(100_000, 'Coins must not exceed 100,000'),
  planId: z.string().uuid('Invalid plan ID').optional(),
});

export const verifyPaymentSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  orderId: z.string().uuid('Invalid order ID'),
});

export type CreateOrderBody = z.infer<typeof createOrderSchema>;
export type VerifyPaymentBody = z.infer<typeof verifyPaymentSchema>;
