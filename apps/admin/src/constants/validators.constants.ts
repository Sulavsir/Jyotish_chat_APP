/**
 * Zod Validation Schemas
 */

import { z } from 'zod';

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

export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

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

  // Professional Details
  specialization: z
    .array(z.string())
    .min(1, 'At least one specialization is required')
    .max(10, 'Maximum 10 specializations allowed'),
  
  experience: z
    .number()
    .int('Experience must be a whole number')
    .min(0, 'Experience cannot be negative')
    .max(100, 'Experience seems unrealistic'),
  
  commissionRate: z
    .number()
    .min(0, 'Commission rate cannot be negative')
    .max(100, 'Commission rate cannot exceed 100%'),
  
  category: z.enum(['ORDINARY', 'PROFESSIONAL', 'PREMIUM'], {
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
});

export type CreateAstrologerFormData = z.infer<typeof createAstrologerSchema>;

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
    PATTERN: /^\+?[1-9]\d{1,14}$/,
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

