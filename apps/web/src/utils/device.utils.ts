/**
 * Device Utilities
 * Generate and manage device fingerprinting for session management
 */

import type { DeviceType } from '@/types/device.types';

/**
 * Generate a cryptographically secure UUID v4
 * Works in all browsers with multiple fallbacks
 */
function generateUUID(): string {
  // Method 1: Try native crypto.randomUUID() (most modern browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fall through to next method
    }
  }

  // Method 2: Use crypto.getRandomValues() (works in all modern browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    try {
      // Standard UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 0x0f) >> (c === 'x' ? 0 : 2);
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    } catch (e) {
      // Fall through to next method
    }
  }

  // Method 3: Fallback using Math.random() (not cryptographically secure, but works everywhere)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a unique device ID
 * Format: Standard UUID v4 (36 characters with hyphens)
 * Example: "550e8400-e29b-41d4-a716-446655440000"
 *
 * Benefits:
 * - Works in ALL browsers (with fallbacks)
 * - Cryptographically secure (when available)
 * - Standardized format (RFC 4122)
 * - Guaranteed > 16 characters
 */
export function generateDeviceId(): string {
  const deviceId = generateUUID();

  // Store in localStorage for persistence across sessions
  localStorage.setItem('jyotish_device_id', deviceId);

  return deviceId;
}

/**
 * Get existing device ID or generate new one
 */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem('jyotish_device_id');

  if (!deviceId || deviceId.length < 16) {
    deviceId = generateDeviceId();
  }

  return deviceId;
}

/**
 * Get device type based on user agent
 * Returns Prisma enum value
 */
export function getDeviceType(): DeviceType {
  const userAgent = navigator.userAgent.toLowerCase();

  // Check for mobile devices
  if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    return 'MOBILE';
  }

  return 'DESKTOP';
}

/**
 * Get device name (browser + OS)
 */
export function getDeviceName(): string {
  const userAgent = navigator.userAgent;

  // Browser detection
  let browser = 'Unknown Browser';
  if (userAgent.indexOf('Firefox') > -1) {
    browser = 'Firefox';
  } else if (userAgent.indexOf('Chrome') > -1) {
    browser = 'Chrome';
  } else if (userAgent.indexOf('Safari') > -1) {
    browser = 'Safari';
  } else if (userAgent.indexOf('Edge') > -1) {
    browser = 'Edge';
  }

  // OS detection
  let os = 'Unknown OS';
  if (userAgent.indexOf('Win') > -1) {
    os = 'Windows';
  } else if (userAgent.indexOf('Mac') > -1) {
    os = 'macOS';
  } else if (userAgent.indexOf('Linux') > -1) {
    os = 'Linux';
  } else if (userAgent.indexOf('Android') > -1) {
    os = 'Android';
  } else if (userAgent.indexOf('iOS') > -1 || userAgent.indexOf('iPhone') > -1) {
    os = 'iOS';
  }

  return `${browser} on ${os}`;
}

/**
 * Get complete device info object
 */
import type { DeviceInfo } from '@/types/device.types';

export function getDeviceInfo(): DeviceInfo {
  return {
    deviceId: getDeviceId(),
    deviceType: getDeviceType(),
    deviceName: getDeviceName(),
  };
}

// Re-export DeviceInfo type for convenience
export type { DeviceInfo } from '@/types/device.types';

/**
 * Validate device ID format
 * Accepts nanoid format (URL-safe characters)
 */
export function isValidDeviceId(deviceId: string): boolean {
  if (!deviceId || deviceId.length < 16) {
    return false;
  }

  // Check for alphanumeric with - or _
  const validFormat = /^[a-zA-Z0-9_-]+$/.test(deviceId);

  return validFormat;
}
