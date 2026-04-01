/**
 * Authentication Type Definitions
 */

import { UserResponse } from './database.types';
import { TOKEN_TYPES } from '../constants/auth.constants';
import { UserRole } from '@jyotish/shared';

export interface UserPayload {
  id: string;
  phone?: string | null;
  email?: string | null;
  role: UserRole;
  category?: string;
  type?: typeof TOKEN_TYPES.ACCESS | typeof TOKEN_TYPES.REFRESH;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
  token?: string;
}

/** Facebook / Apple only — Google account linking stays in `google-oauth.service.ts` */
export type OAuthLinkProvider = 'facebook' | 'apple';

export interface OAuthLinkProfile {
  provider: OAuthLinkProvider;
  providerUserId: string;
  /**
   * Facebook: always set before calling the link service.
   * Apple: may be omitted when JWT has no `email`; primary key is `providerUserId` (`appleId`).
   */
  email?: string;
  name?: string;
  picture?: string;
}

// ─── Google OAuth Types ───────────────────────────────────────────────────

export interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export interface GoogleTokenPayload {
  aud: string;
  sub: string;
  email: string;
  email_verified: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  exp?: string;
  iss?: string;
  azp?: string;
}

export interface SocialLoginResult extends LoginResult {
  isNewUser: boolean;
}

export type GoogleLoginResult = SocialLoginResult;

export interface GoogleMobileLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
  isNewUser: boolean;
}

export interface FacebookMobileLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
  isNewUser: boolean;
}

export interface AppleMobileLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
  isNewUser: boolean;
}

// ─── Facebook OAuth ───────────────────────────────────────────────────────

export interface FacebookGraphUser {
  id: string;
  name?: string;
  email?: string;
  picture?: { data?: { url?: string } };
}

// ─── Apple Sign In (mobile identity token claims) ───────────────────────────

export interface AppleIdTokenPayload {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
  email?: string;
  email_verified?: boolean | string;
  is_private_email?: boolean | string;
}

export interface RefreshTokenPayload {
  id: string;
  phone?: string | null;
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
