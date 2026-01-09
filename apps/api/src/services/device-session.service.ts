/**
 * Device Session Management Service
 * Handles session tracking with device restrictions
 * Rules: Max 1 mobile + 1 desktop device per user/astrologer
 */

import { prisma } from '@jyotish/database';
import { SessionUserType } from '@prisma/client';
import { hashToken } from '../utils/token-utils';
import { DeviceInfo, DeviceType, formatDeviceInfo } from '../utils/device-utils';

export interface CreateSessionData {
  userId?: string;
  astrologerId?: string;
  userType: SessionUserType;
  refreshToken: string;
  deviceInfo: DeviceInfo;
  expiresAt: Date;
}

export interface ActiveSessionInfo {
  sessionId: string;
  deviceName: string;
  deviceType: DeviceType;
  lastUsedAt: Date;
  createdAt: Date;
}

/**
 * Check for existing active sessions of the same device type
 * Returns the existing session if found, null otherwise
 */
export async function checkExistingSession(
  userId: string | undefined,
  astrologerId: string | undefined,
  deviceType: DeviceType,
  userType: SessionUserType
): Promise<ActiveSessionInfo | null> {
  // Skip device restriction for ADMIN
  if (userType === SessionUserType.ADMIN) {
    return null;
  }

  const whereClause: any = {
    deviceType,
    isRevoked: false,
    expiresAt: { gt: new Date() },
  };

  if (userId) {
    whereClause.userId = userId;
  } else if (astrologerId) {
    whereClause.astrologerId = astrologerId;
  }

  const existingSession = await prisma.session.findFirst({
    where: whereClause,
    orderBy: { lastUsedAt: 'desc' },
    select: {
      id: true,
      deviceName: true,
      deviceType: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });

  if (!existingSession) {
    return null;
  }

  return {
    sessionId: existingSession.id,
    deviceName: existingSession.deviceName || 'Unknown Device',
    deviceType: existingSession.deviceType!,
    lastUsedAt: existingSession.lastUsedAt,
    createdAt: existingSession.createdAt,
  };
}

/**
 * Invalidate all sessions of a specific device type for a user
 * Used when logging in from a new device of the same type
 */
export async function invalidateSessionsByDeviceType(
  userId: string | undefined,
  astrologerId: string | undefined,
  deviceType: DeviceType
): Promise<number> {
  const whereClause: any = {
    deviceType,
    isRevoked: false,
  };

  if (userId) {
    whereClause.userId = userId;
  } else if (astrologerId) {
    whereClause.astrologerId = astrologerId;
  }

  const result = await prisma.session.updateMany({
    where: whereClause,
    data: {
      isRevoked: true,
    },
  });

  console.log(
    `🔒 Invalidated ${result.count} ${deviceType} session(s) for ${userId ? 'user' : 'astrologer'} ${userId || astrologerId}`
  );

  return result.count;
}

/**
 * Create a new session with device tracking
 * Automatically invalidates existing sessions of the same device type if needed
 */
export async function createDeviceSession(data: CreateSessionData): Promise<string> {
  const { userId, astrologerId, userType, refreshToken, deviceInfo, expiresAt } = data;

  // Log the login attempt
  console.log(
    `🔐 Login attempt: ${userType} ${userId || astrologerId} on ${formatDeviceInfo(deviceInfo)}`
  );

  // Check for existing session of the same device type
  const existingSession = await checkExistingSession(
    userId,
    astrologerId,
    deviceInfo.deviceType,
    userType
  );

  if (existingSession) {
    console.log(
      `⚠️  Existing ${deviceInfo.deviceType} session found: ${existingSession.deviceName} (last used: ${existingSession.lastUsedAt.toISOString()})`
    );

    // Invalidate the old session
    await invalidateSessionsByDeviceType(userId, astrologerId, deviceInfo.deviceType);

    console.log(`✅ Old ${deviceInfo.deviceType} session invalidated, creating new session`);
  }

  // Hash the refresh token
  const refreshTokenHash = hashToken(refreshToken);

  // Create new session
  const session = await prisma.session.create({
    data: {
      userId,
      astrologerId,
      userType,
      refreshTokenHash,
      expiresAt,
      deviceId: deviceInfo.deviceId,
      deviceType: deviceInfo.deviceType,
      deviceName: deviceInfo.deviceName,
      userAgent: deviceInfo.userAgent,
      ipAddress: deviceInfo.ipAddress,
      isRevoked: false,
    },
  });

  console.log(`✅ New session created: ${session.id} for ${formatDeviceInfo(deviceInfo)}`);

  return session.id;
}

/**
 * Get all active sessions for a user/astrologer
 */
export async function getActiveSessions(
  userId: string | undefined,
  astrologerId: string | undefined
): Promise<ActiveSessionInfo[]> {
  const whereClause: any = {
    isRevoked: false,
    expiresAt: { gt: new Date() },
  };

  if (userId) {
    whereClause.userId = userId;
  } else if (astrologerId) {
    whereClause.astrologerId = astrologerId;
  }

  const sessions = await prisma.session.findMany({
    where: whereClause,
    orderBy: { lastUsedAt: 'desc' },
    select: {
      id: true,
      deviceName: true,
      deviceType: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });

  return sessions.map((s) => ({
    sessionId: s.id,
    deviceName: s.deviceName || 'Unknown Device',
    deviceType: s.deviceType!,
    lastUsedAt: s.lastUsedAt,
    createdAt: s.createdAt,
  }));
}

/**
 * Invalidate a specific session by refresh token hash
 */
export async function invalidateSession(refreshTokenHash: string): Promise<void> {
  await prisma.session.updateMany({
    where: { refreshTokenHash },
    data: { isRevoked: true },
  });
}

/**
 * Validate if a session is still active
 */
export async function validateSession(refreshTokenHash: string): Promise<boolean> {
  const session = await prisma.session.findFirst({
    where: {
      refreshTokenHash,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
  });

  return !!session;
}

/**
 * Update session last used timestamp
 */
export async function updateSessionLastUsed(refreshTokenHash: string): Promise<void> {
  await prisma.session.updateMany({
    where: { refreshTokenHash },
    data: { lastUsedAt: new Date() },
  });
}
