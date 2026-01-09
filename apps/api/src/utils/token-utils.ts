/**
 * Token Utilities
 * Helper functions for token hashing and validation
 */

import crypto from 'crypto';

/**
 * Hash a token using SHA-256
 * Used for storing refresh tokens securely in the database
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a random token
 * Useful for generating device IDs or other random identifiers
 */
export function generateRandomToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Compare a plain token with a hashed token
 */
export function compareToken(plainToken: string, hashedToken: string): boolean {
  const hash = hashToken(plainToken);
  return hash === hashedToken;
}


