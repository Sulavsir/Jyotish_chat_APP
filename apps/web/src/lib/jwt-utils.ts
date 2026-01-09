/**
 * JWT Utility Functions
 * Decode JWT tokens to extract user information (including category)
 */

export interface DecodedToken {
  id: string;
  phone?: string;
  email?: string;
  role: string;
  category?: string; // For astrologers: ORDINARY, PROFESSIONAL, PREMIUM
  type?: string;
  iat?: number; // Issued at
  exp?: number; // Expiration
}

/**
 * Decode a JWT token without verification
 * WARNING: This doesn't verify the signature - only use for reading public claims
 * Server will verify the signature on API calls
 */
export function decodeJWT(token: string): DecodedToken | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Decode base64url
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Get token from cookies
 */
export function getTokenFromCookies(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find((cookie) => cookie.trim().startsWith('accessToken='));
  
  if (!tokenCookie) return null;
  
  return tokenCookie.split('=')[1];
}

/**
 * Get decoded token from cookies
 */
export function getDecodedTokenFromCookies(): DecodedToken | null {
  const token = getTokenFromCookies();
  if (!token) return null;
  
  return decodeJWT(token);
}

/**
 * Get astrologer category from cookie
 * The category is stored in a separate non-httpOnly cookie for frontend access
 */
export function getAstrologerCategoryFromToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const categoryCookie = cookies.find((cookie) => cookie.trim().startsWith('astrologerCategory='));
  
  if (!categoryCookie) return null;
  
  return categoryCookie.split('=')[1] || null;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token);
  
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  // exp is in seconds, Date.now() is in milliseconds
  return decoded.exp * 1000 < Date.now();
}

/**
 * Get user role from token
 */
export function getUserRoleFromToken(): string | null {
  const decoded = getDecodedTokenFromCookies();
  return decoded?.role || null;
}

/**
 * Get user ID from token
 */
export function getUserIdFromToken(): string | null {
  const decoded = getDecodedTokenFromCookies();
  return decoded?.id || null;
}

