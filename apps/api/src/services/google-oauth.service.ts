import { Google, generateState, generateCodeVerifier } from 'arctic';
import { prisma } from '@jyotish/database';
import { UserRole } from '@jyotish/shared';
import { getGoogleOAuthConfig } from '../config/google-oauth.config';
import { authService } from './auth.service';
import { sessionService } from './session.service';
import { toUserResponse } from '../utils';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import type { LoginResult, UserEntity } from '../types';

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

function createGoogleClient(): Google {
  const config = getGoogleOAuthConfig();
  return new Google(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, config.GOOGLE_REDIRECT_URI);
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

  async validateCallback(
    code: string,
    codeVerifier: string
  ): Promise<GoogleUserInfo> {
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

    return userInfo;
  }

  async findOrCreateUser(
    googleUser: GoogleUserInfo,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<LoginResult & { isNewUser: boolean }> {
    // Check if user exists by googleId
    let user = await prisma.user.findUnique({
      where: { googleId: googleUser.sub },
    });

    let isNewUser = false;

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
            name: user.name ?? googleUser.name ?? undefined,
          },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            googleId: googleUser.sub,
            email: googleUser.email,
            emailVerified: new Date(),
            name: googleUser.name ?? undefined,
            profilePhoto: googleUser.picture ?? undefined,
            role: UserRole.CLIENT,
            profileCompleted: false,
          },
        });
        isNewUser = true;
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
