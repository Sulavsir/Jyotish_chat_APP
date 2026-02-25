/**
 * Fonepay request validators (zod)
 */

import { z } from 'zod';

const amountSchema = z.union([
  z.number().positive('Amount must be greater than 0'),
  z.string().min(1, 'Amount is required').refine((s) => !Number.isNaN(parseFloat(s)) && parseFloat(s) > 0, 'Amount must be a positive number'),
]);

export const generateQrSchema = z.object({
  amount: amountSchema,
  remarks1: z.string().max(500).default(''),
  remarks2: z.string().max(500).default(''),
  prn: z.string().min(1, 'prn is required').max(100),
  taxAmount: z.string().optional(),
  taxRefund: z.string().optional(),
});

export const checkStatusSchema = z.object({
  prn: z.string().min(1, 'prn is required').max(100),
});

/** BS date format YYYY.MM.DD e.g. 2081.05.12 */
const invoiceDateSchema = z.string().regex(/^\d{4}\.\d{2}\.\d{2}$/, 'invoiceDate must be YYYY.MM.DD');

export const taxRefundSchema = z.object({
  fonepayTraceId: z.string().min(1, 'fonepayTraceId is required'),
  merchantPRN: z.string().min(1, 'merchantPRN is required'),
  invoiceNumber: z.string().min(1, 'invoiceNumber is required'),
  invoiceDate: invoiceDateSchema,
  transactionAmount: z.string().min(1, 'transactionAmount is required'),
});

export type GenerateQrBody = z.infer<typeof generateQrSchema>;
export type CheckStatusBody = z.infer<typeof checkStatusSchema>;
export type TaxRefundBody = z.infer<typeof taxRefundSchema>;
