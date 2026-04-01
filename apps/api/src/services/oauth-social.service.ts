import type { User } from '@prisma/client';
import { prisma } from '@jyotish/database';
import { ACTIVE_CLIENT_USER_WHERE } from '../constants/user.constants';
import { isPrismaUniqueConstraintViolation } from '../utils/prisma-error.utils';
import { UserRole } from '@jyotish/shared';
import { authService } from './auth.service';
import { sessionService } from './session.service';
import { toUserResponse } from '../utils';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import type { OAuthLinkProfile, SocialLoginResult, UserEntity } from '../types';

/**
 * Shared persistence for **Facebook and Apple only**.
 * Google sign-in uses the dedicated implementation in `google-oauth.service.ts` (unchanged contract).
 *
 * Flow: match by provider id → else match by email when present (with conflict checks) → JWT/session.
 * Apple: `email` may be absent; never match or create using empty/undefined email.
 */
function providerWhere(profile: OAuthLinkProfile) {
  return profile.provider === 'facebook'
    ? { facebookId: profile.providerUserId }
    : { appleId: profile.providerUserId };
}

function providerLinkData(profile: OAuthLinkProfile) {
  return profile.provider === 'facebook'
    ? { facebookId: profile.providerUserId }
    : { appleId: profile.providerUserId };
}

/**
 * If this user row already has a different id for the same provider, refuse to merge (prevents silent hijack).
 */
function assertNoConflictingProviderId(user: User, profile: OAuthLinkProfile): void {
  if (profile.provider === 'facebook') {
    if (user.facebookId && user.facebookId !== profile.providerUserId) {
      console.warn('[OAuthLink] Refusing email match: Facebook id mismatch', {
        userId: user.id,
        existingFacebookId: user.facebookId,
        incomingFacebookId: profile.providerUserId,
      });
      throw new AppError(
        'This email is already linked to a different Facebook account. Sign in with the original method or contact support.',
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.VALIDATION_ERROR
      );  
    }
  } else {
    if (user.appleId && user.appleId !== profile.providerUserId) {
      console.warn('[OAuthLink] Refusing email match: Apple id mismatch', {
        userId: user.id,
        existingAppleId: user.appleId,
        incomingAppleId: profile.providerUserId,
      });
      throw new AppError(
        'This email is already linked to a different Apple account. Sign in with the original method or contact support.',
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.VALIDATION_ERROR
      );
    }
  }
}

class OAuthSocialService {
  async findOrCreateUser(
    profile: OAuthLinkProfile,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<SocialLoginResult> {
    const pw = providerWhere(profile);

    let user = await prisma.user.findFirst({
      where: { ...pw, ...ACTIVE_CLIENT_USER_WHERE },
    });

    let isNewUser = false;

    const displayName = profile.name?.trim() || undefined;
    const emailTrimmed = profile.email?.trim() ?? '';

    if (!user) {
      if (emailTrimmed) {
        user = await prisma.user.findFirst({
          where: {
            email: { equals: emailTrimmed, mode: 'insensitive' as const },
            ...ACTIVE_CLIENT_USER_WHERE,
          },
        });
      }

      if (user) {
        assertNoConflictingProviderId(user, profile);

        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            ...providerLinkData(profile),
            emailVerified: user.emailVerified ?? new Date(),
            profilePhoto: user.profilePhoto ?? profile.picture ?? undefined,
            name: user.name?.trim() ? user.name : displayName,
          },
        });
      } else {
        try {
          user = await prisma.user.create({
            data: {
              ...providerLinkData(profile),
              ...(emailTrimmed && {
                email: emailTrimmed,
                emailVerified: new Date(),
              }),
              name: displayName,
              profilePhoto: profile.picture ?? undefined,
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
                { ...pw, ...ACTIVE_CLIENT_USER_WHERE },
                ...(emailTrimmed
                  ? [
                      {
                        email: { equals: emailTrimmed, mode: 'insensitive' as const },
                        ...ACTIVE_CLIENT_USER_WHERE,
                      },
                    ]
                  : []),
              ],
            },
          });
          if (!user) {
            throw new AppError(
              'Could not complete sign-in. Please try again.',
              HTTP_STATUS.CONFLICT,
              ERROR_CODES.VALIDATION_ERROR
            );
          }
          assertNoConflictingProviderId(user, profile);
          const needsProviderLink =
            (profile.provider === 'facebook' && !user.facebookId) ||
            (profile.provider === 'apple' && !user.appleId);
          if (needsProviderLink) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                ...providerLinkData(profile),
                emailVerified: user.emailVerified ?? new Date(),
                profilePhoto: user.profilePhoto ?? profile.picture ?? undefined,
                name: user.name?.trim() ? user.name : displayName,
              },
            });
          }
        }
      }
    } else {
      const needsEmail = !user.email?.trim() && !!emailTrimmed;
      const needsName = !user.name?.trim() && !!displayName;
      const needsPhoto = !user.profilePhoto && !!profile.picture;
      if (needsEmail || needsName || needsPhoto) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(needsEmail && {
              email: emailTrimmed,
              emailVerified: user.emailVerified ?? new Date(),
            }),
            ...(needsName && displayName && { name: displayName }),
            ...(needsPhoto && { profilePhoto: profile.picture }),
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

export const oauthSocialService = new OAuthSocialService();
