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
  placeOfBirth: string;
  currentAddress: string;
  permanentAddress: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  zodiacSign?: ZodiacSign | null;
  profilePhoto?: string;
}
