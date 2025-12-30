/**
 * Encryption Utilities
 * Uses AES-256-GCM for encrypting sensitive data
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Get encryption key from environment
 */
function getKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY not set in environment variables');
  }
  return key;
}

/**
 * Derive a key from password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
}

/**
 * Encrypt sensitive data
 * @param text - Plain text to encrypt
 * @returns Encrypted string in hex format
 */
export function encrypt(text: string): string {
  try {
    const password = getKey();
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = deriveKey(password, salt);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Combine salt + iv + tag + encrypted
    return Buffer.concat([salt, iv, tag, encrypted]).toString('hex');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 * @param encryptedHex - Encrypted string in hex format
 * @returns Decrypted plain text
 */
export function decrypt(encryptedHex: string): string {
  try {
    const password = getKey();
    const data = Buffer.from(encryptedHex, 'hex');

    const salt = data.slice(0, SALT_LENGTH);
    const iv = data.slice(SALT_LENGTH, TAG_POSITION);
    const tag = data.slice(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = data.slice(ENCRYPTED_POSITION);

    const key = deriveKey(password, salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(encrypted) + decipher.final('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash sensitive data (one-way, for comparison)
 * @param text - Plain text to hash
 * @returns Hashed string
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Mask phone number for display (show last 4 digits)
 * @param phone - Phone number to mask
 * @returns Masked phone number
 */
export function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  return `${phone.slice(0, 2)}${'*'.repeat(phone.length - 6)}${phone.slice(-4)}`;
}

/**
 * Mask email for display
 * @param email - Email to mask
 * @returns Masked email
 */
export function maskEmail(email: string): string {
  const [username, domain] = email.split('@');
  if (username.length <= 2) return `${username[0]}***@${domain}`;
  return `${username.slice(0, 2)}${'*'.repeat(username.length - 2)}@${domain}`;
}
