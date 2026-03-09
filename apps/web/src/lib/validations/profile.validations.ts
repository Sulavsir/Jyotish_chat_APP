/**
 * Profile Form Validation Schemas
 */

import { z } from 'zod';
import { GENDER_OPTIONS, ZODIAC_SIGNS } from '@/constants';

// Profile update schema (for basic info like name, email) - for astrologers
export const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  gender: z.enum([...GENDER_OPTIONS] as [string, ...string[]]).optional().nullable(),
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
  gender: z.enum([...GENDER_OPTIONS] as [string, ...string[]]).optional().nullable(),
  zodiacSign: z.preprocess((v) => (v === '' ? undefined : v), z.enum([...ZODIAC_SIGNS] as [string, ...string[]]).optional()),
});

export type ProfileEditFormData = z.infer<typeof profileEditSchema>;

// Profile setup schema (for initial profile completion)
export const profileSetupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  timeOfBirth: z
    .string()
    .min(1, 'Time of birth is required')
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  placeOfBirth: z.string().min(1, 'Place of birth is required'),
  currentAddress: z.string().optional(),
  permanentAddress: z.string().optional(),
  gender: z.enum([...GENDER_OPTIONS] as [string, ...string[]]).optional().nullable(),
});

export type ProfileSetupFormData = z.infer<typeof profileSetupSchema>;
