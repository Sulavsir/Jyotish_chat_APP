/**
 * Admin Astrologer Validators
 * Update schema excludes isOnline (managed separately)
 */

import { z } from 'zod';
import { AstrologerCategory } from '@jyotish/shared';

// E.164: optional +, then 1-3 digit country code, then 4-14 digit subscriber number
const e164PhoneSchema = z
  .string()
  .min(1, 'Phone is required')
  .regex(/^\+?[1-9]\d{4,14}$/, 'Invalid international phone format (E.164)');

export const updateAstrologerSchema = z
  .object({
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
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateAstrologerInput = z.infer<typeof updateAstrologerSchema>;
