/**
 * Sign in with Apple — OIDC issuer and JWKS (identity token verification).
 */
export const APPLE_OIDC_ISSUER = 'https://appleid.apple.com' as const;

export const APPLE_JWKS_URL = new URL(`${APPLE_OIDC_ISSUER}/auth/keys`);
