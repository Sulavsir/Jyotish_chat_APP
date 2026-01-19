/**
 * Gender Constants
 */

export const GENDER_OPTIONS = ['MALE', 'FEMALE', 'OTHER'] as const;

export type Gender = (typeof GENDER_OPTIONS)[number];

// Gender enum-like object for type-safe usage
export const GenderEnum = {
  MALE: 'MALE' as const,
  FEMALE: 'FEMALE' as const,
  OTHER: 'OTHER' as const,
} as const;

// Type for gender values
export type GenderType = typeof GenderEnum[keyof typeof GenderEnum];
