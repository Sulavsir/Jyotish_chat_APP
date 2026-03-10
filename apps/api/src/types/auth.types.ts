/**
 * Authentication Type Definitions
 */

import { UserResponse } from './database.types';
import { TOKEN_TYPES } from '../constants/auth.constants';
import { UserRole } from '@jyotish/shared';

export interface UserPayload {
  id: string;
  phone?: string;
  email?: string;
  role: UserRole;
  category?: string; // For astrologers: ORDINARY, PROFESSIONAL, PREMIUM
  type?: typeof TOKEN_TYPES.ACCESS | typeof TOKEN_TYPES.REFRESH;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
  token?: string;
}

export interface RefreshTokenPayload {
  id: string;
  phone: string;
  role: string;
  type: typeof TOKEN_TYPES.REFRESH;
}

export interface TempTokenPayload {
  phoneNumber: string;
  type: typeof TOKEN_TYPES.TEMP;
}

export interface PasswordResetTokenPayload {
  userId: string;
  type: typeof TOKEN_TYPES.RESET;
}

export interface AstrologerResetTokenPayload {
  astrologerId: string;
  type: typeof TOKEN_TYPES.RESET_ASTROLOGER;
}
