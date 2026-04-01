/**
 * Web app origin for redirects, email links, and payment callbacks.
 * Set `FRONTEND_URL` in production (no trailing slash required).
 */

export const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:3000' as const;

/**
 * Returns `FRONTEND_URL` when set, otherwise the local dev default.
 * Normalized: trimmed, no trailing slashes.
 */
export function getFrontendOrigin(): string {
  const raw = (process.env.FRONTEND_URL ?? DEFAULT_FRONTEND_ORIGIN).trim();
  return raw.replace(/\/+$/, '');
}
