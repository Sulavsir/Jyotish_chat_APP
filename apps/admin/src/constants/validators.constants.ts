/**
 * Zod Validation Schemas
 */

import { z } from 'zod';
import { parsePhoneNumber } from 'react-phone-number-input/max';

// Common Validators
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[@$!%*?&#]/, 'Password must contain at least one special character');

// E.164 international format; national number must be 10 digits
export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^\+?[1-9]\d{4,14}$/, 'Enter a valid international number (with country code)')
  .refine(
    (val) => {
      try {
        const parsed = parsePhoneNumber(val);
        return parsed?.nationalNumber?.length === 10;
      } catch {
        return false;
      }
    },
    'Phone number must be exactly 10 digits (after country code)'
  );

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must not exceed 100 characters');

// Admin Login Schema
export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

// Create Astrologer Schema
export const createAstrologerSchema = z.object({
  // Basic Information
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().default('MALE'),

  // Professional Details
  specialization: z
    .array(z.string())
    .min(1, 'At least one specialization is required')
    .max(10, 'Maximum 10 specializations allowed'),
  
  experience: z
    .preprocess((value) => {
      if (value === '' || value === null || value === undefined) {
        return undefined;
      }
      if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? value : parsed;
      }
      return value;
    }, z.number().int('Experience must be a whole number').min(0, 'Experience cannot be negative').max(100, 'Experience seems unrealistic')),
  
  commissionRate: z
    .number()
    .min(0, 'Commission rate cannot be negative')
    .max(100, 'Commission rate cannot exceed 100%'),
  
  category: z.enum(['ORDINARY', 'PROFESSIONAL', 'PREMIUM', 'KATHA_VACHAK'], {
    required_error: 'Category is required',
  }),
  
  appointmentFee: z
    .number()
    .min(0, 'Appointment fee cannot be negative')
    .optional()
    .nullable(),
  
  languages: z
    .array(z.string())
    .optional()
    .default([]),

  // Additional Information
  bio: z
    .string()
    .max(1000, 'Bio must not exceed 1000 characters')
    .optional(),
  address: z.string().max(500, 'Address must not exceed 500 characters').optional().nullable(),
});

export type CreateAstrologerFormData = z.infer<typeof createAstrologerSchema>;

// Update Astrologer (edit form) - all fields optional
export const updateAstrologerFormSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional().nullable(),
  phone: phoneSchema.optional(),
  bio: z.string().max(1000).optional().nullable(),
  specialization: z.array(z.string()).min(0).max(20).optional(),
  experience: z
    .preprocess((v) => (v === '' || v === null ? undefined : Number(v)), z.number().int().min(0).max(100))
    .optional()
    .nullable(),
  commissionRate: z.number().min(0).max(100).optional(),
  category: z.enum(['ORDINARY', 'PROFESSIONAL', 'PREMIUM', 'KATHA_VACHAK']).optional(),
  appointmentFee: z
    .preprocess((v) => (v === '' || v === null ? undefined : Number(v)), z.number().min(0))
    .optional()
    .nullable(),
  languages: z.array(z.string()).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
});

export type UpdateAstrologerFormData = z.infer<typeof updateAstrologerFormSchema>;

// Helper function to parse comma-separated strings to array
export const parseCommaSeparatedToArray = (value: string): string[] => {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

// Validation constants
export const VALIDATION_RULES = {
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
  },
  PHONE: {
    PATTERN: /^\+?[1-9]\d{4,14}$/,
  },
  SPECIALIZATION: {
    MIN_ITEMS: 1,
    MAX_ITEMS: 10,
  },
  EXPERIENCE: {
    MIN: 0,
    MAX: 100,
  },
  COMMISSION: {
    MIN: 0,
    MAX: 100,
  },
  BIO: {
    MAX_LENGTH: 1000,
  },
} as const;

