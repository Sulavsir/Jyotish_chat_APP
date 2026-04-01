import { Google, generateState, generateCodeVerifier } from 'arctic';
import { prisma } from '@jyotish/database';
import { ACTIVE_CLIENT_USER_WHERE } from '../constants/user.constants';
import { isPrismaUniqueConstraintViolation } from '../utils/prisma-error.utils';
import { UserRole } from '@jyotish/shared';
import { getGoogleOAuthConfig } from '../config/google-oauth.config';
import { authService } from './auth.service';
import { sessionService } from './session.service';
import { toUserResponse } from '../utils';
import { AppError } from '../middleware/error-handler';
import {
  GOOGLE_OAUTH_TOKENINFO_URL,
  GOOGLE_OIDC_USERINFO_URL,
  HTTP_STATUS,
  ERROR_CODES,
} from '../constants';
import type {
  GoogleUserInfo,
  GoogleTokenPayload,
  GoogleLoginResult,
  UserEntity,
} from '../types';

function resolveGoogleDisplayName(googleUser: GoogleUserInfo): string | undefined {
  const direct = googleUser.name?.trim();
  if (direct) return direct;
  const parts = [googleUser.given_name?.trim(), googleUser.family_name?.trim()].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return undefined;
}

function createGoogleClient(): Google {
  const config = getGoogleOAuthConfig();
  return new Google(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    config.GOOGLE_REDIRECT_URI
  );
}

/** OAuth client IDs allowed as `aud` on Google ID tokens (web + optional native clients). Deduped if iOS equals web. */
function getAllowedGoogleIdTokenAudiences(): string[] {
  const config = getGoogleOAuthConfig();
  const ids = [config.GOOGLE_CLIENT_ID];
  if (config.GOOGLE_IOS_CLIENT_ID) {
    ids.push(config.GOOGLE_IOS_CLIENT_ID);
  }
  if (config.GOOGLE_ANDROID_CLIENT_ID) {
    ids.push(config.GOOGLE_ANDROID_CLIENT_ID);
  }
  return [...new Set(ids)];
}

class GoogleOAuthService {
  createAuthorizationParams(): {
    url: URL;
    state: string;
    codeVerifier: string;
  } {
    const google = createGoogleClient();
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const scopes = ['openid', 'profile', 'email'];

    const url = google.createAuthorizationURL(state, codeVerifier, scopes);
    return { url, state, codeVerifier };
  }

  async validateCallback(code: string, codeVerifier: string): Promise<GoogleUserInfo> {
    const google = createGoogleClient();
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const accessToken = tokens.accessToken();

    const response = await fetch(GOOGLE_OIDC_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new AppError(
        'Failed to fetch Google user info',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.SERVER_ERROR
      );
    }

    const userInfo = (await response.json()) as GoogleUserInfo;

    const email = userInfo.email?.trim() ?? '';
    if (!email || !userInfo.email_verified) {
      throw new AppError(
        'Google account email is not verified',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const normalized: GoogleUserInfo = { ...userInfo, email };

    const resolved = resolveGoogleDisplayName(normalized);
    if (resolved) {
      return { ...normalized, name: resolved };
    }
    return normalized;
  }

  /**
   * Verify ID token from mobile apps (Flutter `google_sign_in`).
   * Uses tokeninfo, then ensures JWT `aud` is one of web + optional iOS/Android OAuth client IDs from env.
   */
  async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    const response = await fetch(
      `${GOOGLE_OAUTH_TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GoogleOAuth] Token verification failed:', errorText);
      throw new AppError(
        'Invalid Google ID token',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    const payload = (await response.json()) as GoogleTokenPayload;

    const validAudiences = getAllowedGoogleIdTokenAudiences();

    if (!validAudiences.includes(payload.aud)) {
      console.error('[GoogleOAuth] Token audience mismatch:', {
        received: payload.aud,
        expected: validAudiences,
      });
      throw new AppError(
        'ID token is not for this application',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // Check token expiry
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      const expiry = parseInt(payload.exp, 10);
      if (expiry < now) {
        throw new AppError(
          'ID token has expired',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.UNAUTHORIZED
        );
      }
    }

    const email = payload.email?.trim() ?? '';
    if (!email || payload.email_verified !== 'true') {
      throw new AppError(
        'Google account email is not verified',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const merged: GoogleUserInfo = {
      sub: payload.sub,
      email,
      email_verified: payload.email_verified === 'true',
      name: payload.name ?? '',
      given_name: payload.given_name,
      family_name: payload.family_name,
      picture: payload.picture,
    };
    const resolved = resolveGoogleDisplayName(merged);
    return resolved ? { ...merged, name: resolved } : merged;
  }

  /**
   * Find or create user for Google only — kept separate from Facebook/Apple (`oauth-social.service.ts`).
   *
   * Email resolution uses the same case-insensitive matching as password/OTP login (`authService.findUserByEmail`)
   * so web + iOS + Android Google sign-in attach to one account and preserve an existing Nepali `phone` from OTP.
   * Google does not provide phone in this flow; we never write `phone` from Google.
   */
  async findOrCreateUser(
    googleUser: GoogleUserInfo,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<GoogleLoginResult> {
    const emailTrimmed = googleUser.email.trim();
    if (!emailTrimmed) {
      throw new AppError(
        'Google account email is missing',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    let user = await prisma.user.findFirst({
      where: { googleId: googleUser.sub, ...ACTIVE_CLIENT_USER_WHERE },
    });

    let isNewUser = false;

    const googleDisplayName = resolveGoogleDisplayName(googleUser);

    if (!user) {
      user = await authService.findUserByEmail(emailTrimmed);

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.sub,
            emailVerified: user.emailVerified ?? new Date(),
            profilePhoto: user.profilePhoto ?? googleUser.picture ?? undefined,
            name: user.name?.trim() ? user.name : (googleDisplayName ?? undefined),
            // phone omitted — keep existing phone from OTP signup
          },
        });
      } else {
        try {
          user = await prisma.user.create({
            data: {
              googleId: googleUser.sub,
              email: emailTrimmed,
              emailVerified: new Date(),
              name: googleDisplayName ?? undefined,
              profilePhoto: googleUser.picture ?? undefined,
              role: UserRole.CLIENT,
              profileCompleted: false,
            },
          });
          isNewUser = true;
        } catch (e) {
          if (!isPrismaUniqueConstraintViolation(e)) {
            throw e;
          }
          user = await prisma.user.findFirst({
            where: {
              OR: [
                { googleId: googleUser.sub, ...ACTIVE_CLIENT_USER_WHERE },
                {
                  email: { equals: emailTrimmed, mode: 'insensitive' },
                  ...ACTIVE_CLIENT_USER_WHERE,
                },
              ],
            },
          });
          if (!user) {
            throw new AppError(
              'Could not complete Google sign-in. Please try again.',
              HTTP_STATUS.CONFLICT,
              ERROR_CODES.VALIDATION_ERROR
            );
          }
        }
      }
    } else {
      const needsEmail = !user.email?.trim() && !!emailTrimmed;
      const needsName = !user.name?.trim() && !!googleDisplayName;
      const needsPhoto = !user.profilePhoto && !!googleUser.picture;
      if (needsEmail || needsName || needsPhoto) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(needsEmail && {
              email: emailTrimmed,
              emailVerified: user.emailVerified ?? new Date(),
            }),
            ...(needsName && googleDisplayName && { name: googleDisplayName }),
            ...(needsPhoto && { profilePhoto: googleUser.picture }),
          },
        });
      }
    }

    if (!user.isActive) {
      throw new AppError(
        'Your account has been deactivated. Please contact support.',
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.FORBIDDEN
      );
    }

    const { accessToken, refreshToken } = authService.generateTokens({
      id: user.id,
      phone: user.phone ?? undefined,
      email: user.email ?? undefined,
      role: user.role as UserRole,
    });

    await sessionService.createSession(user.id, refreshToken, metadata);

    const userResponse = toUserResponse(user as UserEntity);

    return {
      accessToken,
      refreshToken,
      user: userResponse,
      token: accessToken,
      isNewUser,
    };
  }
}

export const googleOAuthService = new GoogleOAuthService();
