/**
 * User Type Definitions
 */

import { UserResponse } from './database.types';
import { ZodiacSign } from '@jyotish/shared';

export interface CreateUserData {
  phoneNumber: string;
  password: string;
}

export interface CreateUserResult {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
  // Legacy support
  token?: string;
}

export interface ProfileSetupData {
  name: string;
  email: string;
  dateOfBirth: string | Date; // YYYY-MM-DD or Date object
  timeOfBirth: string; // HH:MM
  placeOfBirth: string; // Display string; required for OUTSIDE_NEPAL, or built from Pradesh+District+Location for NEPAL
  placeOfBirthType?: 'NEPAL' | 'OUTSIDE_NEPAL';
  placeOfBirthPradeshId?: string | null;
  placeOfBirthDistrictId?: string | null;
  placeOfBirthLocation?: string | null; // Area/location when NEPAL
  currentAddress: string;
  permanentAddress: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  zodiacSign?: ZodiacSign | null;
  profilePhoto?: string;
}
