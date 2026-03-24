import { z } from 'zod';

const optionalTrimmed = z
  .union([z.string(), z.undefined()])
  .transform((s) => (s == null || String(s).trim() === '' ? undefined : String(s).trim()));

const optionalIsoDate = z
  .union([z.string(), z.undefined()])
  .transform((v) => {
    if (v == null || String(v).trim() === '') return undefined;
    const s = String(v).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
    return s;
  });

/**
 * GET /api/v1/admin/users
 */
export const listAdminUsersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  search: optionalTrimmed,
  isActive: z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined || v === '') return undefined;
      if (v === 'true') return true;
      if (v === 'false') return false;
      return undefined;
    }),
    /** Filter users whose account was created on/after this day (UTC start) */
    joinedFrom: optionalIsoDate,
    /** Filter users whose account was created on/before this day (UTC end) */
    joinedTo: optionalIsoDate,
  })
  .refine(
    (d) => !d.joinedFrom || !d.joinedTo || d.joinedFrom <= d.joinedTo,
    { message: 'joinedFrom must be on or before joinedTo', path: ['joinedTo'] }
  );

export type ListAdminUsersQuery = z.infer<typeof listAdminUsersQuerySchema>;
