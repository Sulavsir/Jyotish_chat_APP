import * as jose from 'jose';
import { oauthSocialService } from './oauth-social.service';
import { AppError } from '../middleware/error-handler';
import { APPLE_JWKS_URL, APPLE_OIDC_ISSUER, HTTP_STATUS, ERROR_CODES } from '../constants';
import { getAppleAllowedAudiences } from '../config/apple-oauth.config';
import type { AppleIdTokenPayload, OAuthLinkProfile, SocialLoginResult } from '../types';

let jwks: jose.JWTVerifyGetKey | undefined;

function getAppleJwks(): jose.JWTVerifyGetKey {
  if (!jwks) {
    jwks = jose.createRemoteJWKSet(APPLE_JWKS_URL);
  }
  return jwks;
}

function parseEmailVerified(payload: AppleIdTokenPayload): boolean {
  const v = payload.email_verified;
  if (typeof v === 'boolean') return v;
  if (v === 'true') return true;
  return false;
}

class AppleOAuthService {
  /**
   * Verify native Sign in with Apple identity token (JWT).
   */
  async verifyIdentityToken(identityToken: string): Promise<OAuthLinkProfile> {
    const audiences = getAppleAllowedAudiences();
    if (audiences.length === 0) {
      throw new AppError(
        'Apple Sign In is not configured',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.SERVER_ERROR
      );
    }

    let payload: jose.JWTPayload;
    try {
      const { payload: p } = await jose.jwtVerify(identityToken, getAppleJwks(), {
        issuer: APPLE_OIDC_ISSUER,
        audience: audiences,
      });
      payload = p;
    } catch (e) {
      console.error('[AppleOAuth] JWT verification failed:', e);
      throw new AppError(
        'Invalid Apple identity token',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    const sub = typeof payload.sub === 'string' ? payload.sub : '';
    if (!sub) {
      throw new AppError(
        'Apple token missing subject',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const typed = payload as unknown as AppleIdTokenPayload;
    const emailRaw = typeof typed.email === 'string' ? typed.email.trim() : '';

    if (emailRaw && typed.email_verified !== undefined && !parseEmailVerified(typed)) {
      throw new AppError(
        'Apple email is not verified',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    return {
      provider: 'apple',
      providerUserId: sub,
      ...(emailRaw && { email: emailRaw.toLowerCase() }),
      name: undefined,
      picture: undefined,
    };
  }

  async findOrCreateUser(
    profile: OAuthLinkProfile,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<SocialLoginResult> {
    return oauthSocialService.findOrCreateUser(profile, metadata);
  }
}

export const appleOAuthService = new AppleOAuthService();
