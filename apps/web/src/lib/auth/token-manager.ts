import { STORAGE_KEYS } from '@/constants';

export class TokenManager {
  /**
   * NO TOKENS TO STORE - They're all in httpOnly cookies!
   * This method is kept for backward compatibility but does nothing
   */
  static setTokens(_accessToken?: string, _refreshToken?: string): void {
    // Tokens are automatically stored as httpOnly cookies by server
    // Nothing to do on client side
  }

  /**
   * DEPRECATED: Cannot get access token from JavaScript (it's httpOnly)
   * This is kept for backward compatibility but returns null
   */
  static getAccessToken(): null {
    // Access token is in httpOnly cookie, cannot be accessed by JavaScript
    return null;
  }

  /**
   * DEPRECATED: Cannot get refresh token from JavaScript (it's httpOnly)
   * This is kept for backward compatibility but returns null
   */
  static getRefreshToken(): null {
    // Refresh token is in httpOnly cookie, cannot be accessed by JavaScript
    return null;
  }

  /**
   * DEPRECATED: Tokens are managed by server via cookies
   */
  static updateAccessToken(_accessToken: string): void {
    // Tokens are automatically updated by server via httpOnly cookies
    // Nothing to do on client side
  }

  /**
   * Clear local storage (cookies are cleared by server on logout)
   */
  static clearTokens(): void {
    // Clear any local storage (user data, etc.)
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  /**
   * Check if user is authenticated by calling /me endpoint
   * (Can't check cookies from JavaScript)
   */
  static isAuthenticated(): boolean {
    // Can't check httpOnly cookies from JavaScript
    // Will be determined by API call
    return false;
  }
}
