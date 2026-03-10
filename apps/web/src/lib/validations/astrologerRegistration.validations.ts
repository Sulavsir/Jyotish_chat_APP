/**
 * Astrologer Registration Form Validation Schema
 */

import { z } from 'zod';
import { FILE_UPLOAD } from '@/constants/file-upload.constants';

// E.164 international format (same as admin)
const e164PhoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^\+?[1-9]\d{4,14}$/, 'Invalid international phone format (E.164)');

export const astrologerRegistrationSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
    phone: e164PhoneSchema,
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
      .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
      .regex(/(?=.*\d)/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    bio: z.string().max(500, 'Bio is too long').optional(),
    address: z.string().max(500, 'Address is too long').optional().nullable(),
    specialization: z.array(z.string()).min(1, 'Please enter at least one specialization'),
    experience: z
      .preprocess(
        (value) => {
          if (value === '' || value === null || value === undefined) {
            return undefined;
          }
          if (typeof value === 'string') {
            const parsed = Number(value);
            return Number.isNaN(parsed) ? value : parsed;
          }
          return value;
        },
        z
          .number()
          .int('Experience must be a whole number')
          .min(0, 'Experience cannot be negative')
          .max(99, 'Experience cannot be more than two digits')
      )
      .optional(),

    languages: z.array(z.string()).min(1, 'Please enter at least one language'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
    country: z.string().max(100, 'Country is too long').optional().nullable(),
    proofOfAstrology: z
      .any()
      .refine((files) => {
        // Must have at least one file
        if (!files) return false;
        if (Array.isArray(files) && files.length === 0) return false;
        const fileArray = Array.isArray(files) ? files : [files];
        return fileArray.length > 0;
      }, 'At least one proof of astrology certificate is required')
      .refine((files) => {
        // If there are no files, skip this check; the previous refine will flag it
        if (!files || (Array.isArray(files) && files.length === 0)) {
          return true;
        }
        const fileArray = Array.isArray(files) ? files : [files];
        return fileArray.every((file: File) => file && file.size <= 10 * 1024 * 1024);
      }, 'Each file size must be less than 10MB')
      .refine((files) => {
        // If there are no files, skip this check; the first refine handles it
        if (!files || (Array.isArray(files) && files.length === 0)) {
          return true;
        }
        const fileArray = Array.isArray(files) ? files : [files];
        const allowedTypes = Object.keys(FILE_UPLOAD.ALLOWED_TYPES);
        return fileArray.every((file: File) => file && allowedTypes.includes(file.type));
      }, 'Files must be valid image or document types'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type AstrologerRegistrationFormData = z.infer<typeof astrologerRegistrationSchema>;
