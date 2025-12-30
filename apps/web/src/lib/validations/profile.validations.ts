/**
 * Profile Form Validation Schemas
 */

import { z } from 'zod';

// Profile update schema (for basic info like name, email)
export const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

// Complete profile edit schema (includes all fields for client profile)
export const profileEditSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  timeOfBirth: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
    .optional()
    .or(z.literal('')),
  placeOfBirth: z.string().optional(),
  currentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
});

export type ProfileEditFormData = z.infer<typeof profileEditSchema>;

// Profile setup schema (for initial profile completion)
export const profileSetupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  timeOfBirth: z
    .string()
    .min(1, 'Time of birth is required')
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  placeOfBirth: z.string().min(1, 'Place of birth is required'),
  currentAddress: z.string().min(1, 'Current address is required'),
  permanentAddress: z.string().min(1, 'Permanent address is required'),
});

export type ProfileSetupFormData = z.infer<typeof profileSetupSchema>;
