import { Facebook, generateState } from 'arctic';
import { oauthSocialService } from './oauth-social.service';
import { AppError } from '../middleware/error-handler';
import { FACEBOOK_GRAPH_API_BASE, HTTP_STATUS, ERROR_CODES } from '../constants';
import { getFacebookOAuthConfig } from '../config/facebook-oauth.config';
import type { FacebookGraphUser, OAuthLinkProfile, SocialLoginResult } from '../types';

function createFacebookClient(): Facebook {
  const config = getFacebookOAuthConfig();
  return new Facebook(
    config.FACEBOOK_APP_ID,
    config.FACEBOOK_APP_SECRET,
    config.FACEBOOK_REDIRECT_URI
  );
}

async function fetchFacebookUser(accessToken: string): Promise<OAuthLinkProfile> {
  const url = new URL(`${FACEBOOK_GRAPH_API_BASE}/me`);
  url.searchParams.set('fields', 'id,name,email,picture');
  url.searchParams.set('access_token', accessToken);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const text = await response.text();
    console.error('[FacebookOAuth] Graph /me failed:', text);
    throw new AppError(
      'Failed to fetch Facebook profile',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.UNAUTHORIZED
    );
  }

  const data = (await response.json()) as FacebookGraphUser;

  if (!data.id) {
    throw new AppError(
      'Invalid Facebook profile response',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  if (!data.email?.trim()) {
    throw new AppError(
      'Facebook did not return an email. Grant email permission to sign in.',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const pictureUrl = data.picture?.data?.url;

  return {
    provider: 'facebook',
    providerUserId: data.id,
    email: data.email.trim().toLowerCase(),
    name: data.name?.trim(),
    picture: pictureUrl,
  };
}

class FacebookOAuthService {
  createAuthorizationParams(): { url: URL; state: string } {
    const facebook = createFacebookClient();
    const state = generateState();
    const scopes = ['email', 'public_profile'];
    const url = facebook.createAuthorizationURL(state, scopes);
    return { url, state };
  }

  async validateWebCallback(code: string): Promise<OAuthLinkProfile> {
    const facebook = createFacebookClient();
    const tokens = await facebook.validateAuthorizationCode(code);
    const accessToken = tokens.accessToken();
    return fetchFacebookUser(accessToken);
  }

  /**
   * Mobile SDK: verify access token belongs to our app, then load /me.
   */
  async verifyMobileAccessToken(accessToken: string): Promise<OAuthLinkProfile> {
    const config = getFacebookOAuthConfig();
    const appToken = `${config.FACEBOOK_APP_ID}|${config.FACEBOOK_APP_SECRET}`;
    const debugUrl = new URL(`${FACEBOOK_GRAPH_API_BASE}/debug_token`);
    debugUrl.searchParams.set('input_token', accessToken);
    debugUrl.searchParams.set('access_token', appToken);

    const debugRes = await fetch(debugUrl.toString());
    if (!debugRes.ok) {
      console.error('[FacebookOAuth] debug_token failed');
      throw new AppError(
        'Invalid Facebook access token',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    const debugJson = (await debugRes.json()) as {
      data?: { app_id?: string; is_valid?: boolean };
    };

    if (!debugJson.data?.is_valid || debugJson.data.app_id !== config.FACEBOOK_APP_ID) {
      throw new AppError(
        'Facebook token is not valid for this application',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    return fetchFacebookUser(accessToken);
  }

  async findOrCreateUser(
    profile: OAuthLinkProfile,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<SocialLoginResult> {
    return oauthSocialService.findOrCreateUser(profile, metadata);
  }
}

export const facebookOAuthService = new FacebookOAuthService();
