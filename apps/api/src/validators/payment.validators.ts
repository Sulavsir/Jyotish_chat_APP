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

export const verifyPaymentSchema = z
  .object({
    token: z.string().optional(),
    requestId: z.string().optional(),
    orderId: z.string().uuid('Invalid order ID'),
  })
  .refine((data) => (data.token?.trim() ?? '').length > 0 || (data.requestId?.trim() ?? '').length > 0, {
    message: 'Token or requestId (GetPay transaction id) is required',
    path: ['token'],
  });

export const createFonepayQrOrderSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  coins: z.number().int().nonnegative().max(100_000),
  planId: z.string().uuid().optional(),
});

export const verifyFonepayQrSchema = z.object({
  prn: z.string().min(1, 'prn is required'),
});

export const createFonepayCardOrderSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  coins: z.number().int().nonnegative().max(100_000),
  planId: z.string().uuid().optional(),
});

export type CreateOrderBody = z.infer<typeof createOrderSchema>;
export type VerifyPaymentBody = z.infer<typeof verifyPaymentSchema>;
export type CreateFonepayQrOrderBody = z.infer<typeof createFonepayQrOrderSchema>;
export type VerifyFonepayQrBody = z.infer<typeof verifyFonepayQrSchema>;
export type CreateFonepayCardOrderBody = z.infer<typeof createFonepayCardOrderSchema>;
