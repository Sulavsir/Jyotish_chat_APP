import { Google, generateState, generateCodeVerifier } from 'arctic';
import { prisma } from '@jyotish/database';
import { UserRole } from '@jyotish/shared';
import { getGoogleOAuthConfig } from '../config/google-oauth.config';
import { authService } from './auth.service';
import { sessionService } from './session.service';
import { toUserResponse } from '../utils';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import type { GoogleUserInfo, GoogleTokenPayload, GoogleLoginResult, UserEntity } from '../types';

/** Prefer `name`; otherwise combine given + family (mobile ID tokens often omit `name`). */
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

    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
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

    if (!userInfo.email || !userInfo.email_verified) {
      throw new AppError(
        'Google account email is not verified',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const resolved = resolveGoogleDisplayName(userInfo);
    if (resolved) {
      return { ...userInfo, name: resolved };
    }
    return userInfo;
  }

  /**
   * Verify ID token from mobile apps (Flutter google_sign_in)
   * Uses Google's tokeninfo endpoint to verify the token
   */
  async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    const config = getGoogleOAuthConfig();
    const GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

    // Verify token with Google's tokeninfo endpoint
    const response = await fetch(
      `${GOOGLE_TOKEN_INFO_URL}?id_token=${encodeURIComponent(idToken)}`
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

    // Build list of valid audiences (Web client ID is always required, mobile IDs are optional)
    const validAudiences: string[] = [config.GOOGLE_CLIENT_ID];

    if (config.GOOGLE_IOS_CLIENT_ID) {
      validAudiences.push(config.GOOGLE_IOS_CLIENT_ID);
    }
    if (config.GOOGLE_ANDROID_CLIENT_ID) {
      validAudiences.push(config.GOOGLE_ANDROID_CLIENT_ID);
    }

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

    // Verify email is present and verified
    if (!payload.email || payload.email_verified !== 'true') {
      throw new AppError(
        'Google account email is not verified',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const merged: GoogleUserInfo = {
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified === 'true',
      name: payload.name ?? '',
      given_name: payload.given_name,
      family_name: payload.family_name,
      picture: payload.picture,
    };
    const resolved = resolveGoogleDisplayName(merged);
    return resolved ? { ...merged, name: resolved } : merged;
  }

  async findOrCreateUser(
    googleUser: GoogleUserInfo,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<GoogleLoginResult> {
    // Check if user exists by googleId
    let user = await prisma.user.findUnique({
      where: { googleId: googleUser.sub },
    });

    let isNewUser = false;

    const googleDisplayName = resolveGoogleDisplayName(googleUser);

    if (!user) {
      // Check if user exists by email (link accounts)
      user = await prisma.user.findFirst({
        where: { email: googleUser.email },
      });

      if (user) {
        // Link Google account to existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.sub,
            emailVerified: user.emailVerified ?? new Date(),
            profilePhoto: user.profilePhoto ?? googleUser.picture ?? undefined,
            name: user.name?.trim() ? user.name : googleDisplayName ?? undefined,
          },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            googleId: googleUser.sub,
            email: googleUser.email,
            emailVerified: new Date(),
            name: googleDisplayName ?? undefined,
            profilePhoto: googleUser.picture ?? undefined,
            role: UserRole.CLIENT,
            profileCompleted: false,
          },
        });
        isNewUser = true;
      }
    } else {
      const needsEmail = !user.email?.trim() && !!googleUser.email;
      const needsName = !user.name?.trim() && !!googleDisplayName;
      const needsPhoto = !user.profilePhoto && !!googleUser.picture;
      if (needsEmail || needsName || needsPhoto) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(needsEmail && {
              email: googleUser.email,
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
