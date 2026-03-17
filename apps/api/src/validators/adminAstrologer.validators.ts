import { z } from 'zod';
import { AstrologerCategory } from '@jyotish/shared';
import { queryPaginationSchema } from './query.validators';

// E.164: optional +, then 1-3 digit country code, then 4-14 digit subscriber number
const e164PhoneSchema = z
  .string()
  .min(1, 'Phone is required')
  .regex(/^\+?[1-9]\d{4,14}$/, 'Invalid international phone format (E.164)');

export const updateAstrologerSchema = z
  .object({
    editPassword: z.string().min(1, 'Edit password is required').optional(),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
    email: z.string().email('Invalid email').optional().nullable(),
    phone: e164PhoneSchema.optional(),
    bio: z.string().max(1000).optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    profilePhoto: z.string().url().optional().nullable(),
    specialization: z.array(z.string()).min(0).max(20).optional(),
    experience: z.number().int().min(0).max(100).optional().nullable(),
    commissionRate: z.number().min(0).max(100).optional(),
    languages: z.array(z.string()).optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
    category: z.nativeEnum(AstrologerCategory).optional(),
    appointmentFee: z.number().min(0).optional().nullable(),
    proofOfAstrology: z.string().min(1).optional().nullable(),
    chatMessageFee: z.number().min(0).optional().nullable(),
    country: z.string().max(100).optional().nullable(),
    inhouseAstrologer: z.boolean().optional(),
  })
  .refine((obj) => Object.keys(obj).filter((k) => k !== 'editPassword').length > 0, {
    message: 'At least one field must be provided',
  });

export const deleteAstrologerBodySchema = z.object({
  editPassword: z.string().min(1, 'Edit password is required'),
});

export type DeleteAstrologerBody = z.infer<typeof deleteAstrologerBodySchema>;

/** Body schema for POST /admin/astrologers/verify-edit-password */
export const verifyEditPasswordBodySchema = z.object({
  password: z.string().min(1, 'Password is required'),
});
export type VerifyEditPasswordBody = z.infer<typeof verifyEditPasswordBodySchema>;

export type UpdateAstrologerInput = z.infer<typeof updateAstrologerSchema>;

export const listAdminAstrologersQuerySchema = queryPaginationSchema.extend({
  search: z.string().optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  isVerified: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  isOnline: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
});

export type ListAdminAstrologersQuery = z.infer<typeof listAdminAstrologersQuerySchema>;


