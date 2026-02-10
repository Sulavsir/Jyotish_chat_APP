/**
 * Device Detection and Management Utilities
 * Handles device type detection, device ID validation, and device naming
 */

import { Request } from 'express';
import { DeviceType } from '@prisma/client';
import { getClientIp } from './request-utils';

// Re-export for convenience
export { DeviceType };

export interface DeviceInfo {
  deviceId: string;
  deviceType: DeviceType;
  deviceName: string;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Detect device type from User-Agent string
 */
export function detectDeviceType(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase();

  // Check for mobile devices
  const mobileKeywords = [
    'mobile',
    'android',
    'iphone',
    'ipod',
    'blackberry',
    'windows phone',
    'iemobile',
    'opera mini',
    'mobile safari',
  ];

  const isMobile = mobileKeywords.some((keyword) => ua.includes(keyword));

  return isMobile ? DeviceType.MOBILE : DeviceType.DESKTOP;
}

/**
 * Generate a human-readable device name from User-Agent
 */
export function generateDeviceName(userAgent: string, deviceType: DeviceType): string {
  const ua = userAgent.toLowerCase();

  // Mobile device detection
  if (deviceType === DeviceType.MOBILE) {
    if (ua.includes('iphone')) return 'iPhone';
    if (ua.includes('ipad')) return 'iPad';
    if (ua.includes('android')) {
      // Try to extract device model
      const match = userAgent.match(/\(([^)]+)\)/);
      if (match && match[1].includes('Android')) {
        return 'Android Device';
      }
      return 'Android Device';
    }
    return 'Mobile Device';
  }

  // Desktop browser detection
  if (ua.includes('chrome') && !ua.includes('edge')) return 'Chrome Browser';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari Browser';
  if (ua.includes('firefox')) return 'Firefox Browser';
  if (ua.includes('edge')) return 'Edge Browser';
  if (ua.includes('opera')) return 'Opera Browser';

  return 'Desktop Browser';
}

/**
 * Validate device ID format (should be a UUID or similar unique identifier)
 */
export function validateDeviceId(deviceId: string): boolean {
  if (!deviceId || typeof deviceId !== 'string') {
    return false;
  }

  // Allow UUIDs, alphanumeric strings, and common device ID formats
  // Min length: 16 characters for security
  const deviceIdRegex = /^[a-zA-Z0-9_-]{16,}$/;
  return deviceIdRegex.test(deviceId);
}

/**
 * Extract device information from request
 * Prioritizes client-provided deviceId and deviceType, but validates and detects from User-Agent as fallback
 *
 * TEMPORARY: Device validation is commented out for now - will be implemented properly later
 */
export function extractDeviceInfo(req: Request): DeviceInfo {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const ipAddress = getClientIp(req) ?? req.socket?.remoteAddress;

  // Get device info from request body or headers
  let deviceId = req.body?.deviceId || req.headers['x-device-id'];
  let deviceType = req.body?.deviceType || req.headers['x-device-type'];

  // TEMPORARY: Device validation disabled - generate fallback device ID
  // TODO: Re-enable proper device tracking later
  if (!deviceId || !validateDeviceId(deviceId as string)) {
    // Generate a temporary device ID based on user agent and IP
    const timestamp = Date.now();
    const hash = require('crypto')
      .createHash('md5')
      .update(`${userAgent}-${ipAddress}-${timestamp}`)
      .digest('hex');
    deviceId = `temp-device-${hash}`;
    console.log(`⚠️  Generated temporary device ID: ${deviceId.substring(0, 20)}...`);
  }

  // Validate and detect device type
  const detectedDeviceType = detectDeviceType(userAgent);

  if (deviceType) {
    // Validate provided device type
    if (deviceType !== DeviceType.MOBILE && deviceType !== DeviceType.DESKTOP) {
      console.warn(
        `Invalid deviceType provided: ${deviceType}, using detected: ${detectedDeviceType}`
      );
      deviceType = detectedDeviceType;
    }
  } else {
    deviceType = detectedDeviceType;
  }

  const deviceName = generateDeviceName(userAgent, deviceType as DeviceType);

  return {
    deviceId: deviceId as string,
    deviceType: deviceType as DeviceType,
    deviceName,
    userAgent,
    ipAddress,
  };
}

/**
 * Format device info for logging
 */
export function formatDeviceInfo(deviceInfo: DeviceInfo): string {
  return `${deviceInfo.deviceName} (${deviceInfo.deviceType}) [${deviceInfo.deviceId.substring(0, 8)}...]`;
}
