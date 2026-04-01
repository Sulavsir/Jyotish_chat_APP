import type { Request, Response } from 'express';
import { getFrontendOrigin } from '../constants/frontend.constants';

const OAUTH_COOKIE_MAX_AGE_MS = 10 * 60 * 1000;

const OAUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: OAUTH_COOKIE_MAX_AGE_MS,
  path: '/',
};

function normalizeOriginString(raw: string): string {
  return raw.trim().replace(/\/+$/, '');
}

/** Origins explicitly allowed (CORS_ORIGIN + FRONTEND_URL). */
function getExplicitAllowedOrigins(): string[] {
  const set = new Set<string>();
  const cors = process.env.CORS_ORIGIN || '';
  cors.split(',').forEach((s) => {
    const n = normalizeOriginString(s);
    if (!n) return;
    try {
      set.add(new URL(n).origin);
    } catch {
      /* ignore */
    }
  });
  try {
    set.add(new URL(getFrontendOrigin()).origin);
  } catch {
    /* ignore */
  }
  return [...set];
}

/**
 * Validates `frontend` query value (full URL or origin) for OAuth return redirects.
 * In development, also allows typical LAN origins so FRONTEND_URL can stay localhost.
 */
export function isOAuthRedirectOriginAllowed(candidate: string): boolean {
  const trimmed = candidate.trim();
  if (!trimmed) return false;
  let origin: string;
  try {
    origin = new URL(trimmed).origin;
  } catch {
    return false;
  }

  if (getExplicitAllowedOrigins().includes(origin)) {
    return true;
  }

  if (process.env.NODE_ENV !== 'production') {
    try {
      const u = new URL(origin);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
      const host = u.hostname;
      if (host === 'localhost' || host === '127.0.0.1') return true;
      if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
      if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
    } catch {
      return false;
    }
  }

  return false;
}

export const OAUTH_FRONTEND_COOKIE = {
  FACEBOOK: 'facebook_oauth_frontend',
  GOOGLE: 'google_oauth_frontend',
} as const;

export function setOAuthFrontendCookieIfAllowed(
  res: Response,
  cookieName: string,
  frontendQuery: unknown
): void {
  if (typeof frontendQuery !== 'string' || !frontendQuery.trim()) return;
  if (!isOAuthRedirectOriginAllowed(frontendQuery)) return;
  const origin = new URL(frontendQuery.trim()).origin;
  res.cookie(cookieName, origin, OAUTH_COOKIE_OPTIONS);
}

/**
 * Read validated origin from cookie, clear cookie, return base URL without trailing slash.
 */
export function takeOAuthFrontendBase(req: Request, res: Response, cookieName: string): string | null {
  const raw = req.cookies?.[cookieName] as string | undefined;
  res.clearCookie(cookieName, { path: '/' });
  if (!raw?.trim()) return null;
  if (!isOAuthRedirectOriginAllowed(raw)) return null;
  return raw.replace(/\/$/, '');
}

/** Use after OAuth callback: prefer validated `frontend` cookie, else `fallback` (e.g. FRONTEND_URL). */
export function resolveOAuthRedirectBase(
  req: Request,
  res: Response,
  cookieName: string,
  fallback: string
): string {
  const taken = takeOAuthFrontendBase(req, res, cookieName);
  return taken ?? fallback.replace(/\/$/, '');
}
