import { z } from 'zod';

const optionalTrimmed = z
  .union([z.string(), z.undefined()])
  .transform((s) => (s == null || String(s).trim() === '' ? undefined : String(s).trim()));

/** YYYY-MM-DD for payment date filters (coin transaction `createdAt`) */
const optionalIsoDate = z
  .union([z.string(), z.undefined()])
  .transform((v) => {
    if (v == null || String(v).trim() === '') return undefined;
    const s = String(v).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
    return s;
  });

/**
 * GET /api/v1/admin/coin-transactions
 */
export const listAdminPlatformPaymentQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: optionalTrimmed,
    paymentMethod: optionalTrimmed,
    paymentDateFrom: optionalIsoDate,
    paymentDateTo: optionalIsoDate,
  })
  .refine(
    (d) =>
      !d.paymentDateFrom || !d.paymentDateTo || d.paymentDateFrom <= d.paymentDateTo,
    { message: 'paymentDateFrom must be on or before paymentDateTo', path: ['paymentDateTo'] }
  );

export type ListAdminPlatformPaymentQuery = z.infer<typeof listAdminPlatformPaymentQuerySchema>;
