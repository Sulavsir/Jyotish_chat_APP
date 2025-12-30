/**
 * User Type Definitions
 */

import { UserResponse } from './database.types';

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
  profilePhoto?: string;
}
