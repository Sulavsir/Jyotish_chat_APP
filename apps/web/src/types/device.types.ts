/**
 * Device Types
 * Matches backend Prisma schema exactly
 */

// Import DeviceType from Prisma generated types to ensure consistency
// This ensures frontend always matches backend enum
export type DeviceType = 'MOBILE' | 'DESKTOP';

export interface DeviceInfo {
  deviceId: string;
  deviceType: DeviceType;
  deviceName: string;
}
