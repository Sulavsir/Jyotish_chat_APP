/**
 * Session Service - Handle refresh token sessions
 *
 * Security features:
 * - Refresh tokens stored hashed (never plain text)
 * - One-time use (rotated on every refresh)
 * - Revocable (for logout)
 * - Tracked (user agent, IP, last used)
 */

import crypto from 'crypto';
import { prisma } from '@jyotish/database';
import { AUTH_CONFIG } from '../constants';

export class SessionService {
  /**
   * Hash refresh token for storage
   * Uses SHA-256 for fast, secure hashing
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Create a new session with refresh token
   */
  async createSession(
    userId: string,
    refreshToken: string,
    metadata?: {
      userAgent?: string;
      ipAddress?: string;
    }
  ): Promise<void> {
    const refreshTokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN_MS);

    await prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        expiresAt,
        userAgent: metadata?.userAgent,
        ipAddress: metadata?.ipAddress,
        isRevoked: false,
      },
    });
  }

  /**
   * Validate refresh token and get session
   * Returns session if valid, null if invalid/revoked/expired
   */
  async validateRefreshToken(refreshToken: string): Promise<{
    userId: string;
    sessionId: string;
  } | null> {
    const refreshTokenHash = this.hashToken(refreshToken);

    const session = await prisma.session.findUnique({
      where: { refreshTokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        isRevoked: true,
      },
    });

    // Check if session exists
    if (!session) {
      return null;
    }

    // Check if revoked
    if (session.isRevoked) {
      return null;
    }

    // Check if expired
    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await this.revokeSession(session.id);
      return null;
    }

    // Update last used timestamp
    await prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      userId: session.userId,
      sessionId: session.id,
    };
  }

  /**
   * Rotate refresh token (one-time use)
   * Revokes old session and creates new one
   */
  async rotateRefreshToken(
    oldRefreshToken: string,
    newRefreshToken: string,
    metadata?: {
      userAgent?: string;
      ipAddress?: string;
    }
  ): Promise<boolean> {
    const oldTokenHash = this.hashToken(oldRefreshToken);

    // Find and revoke old session
    const oldSession = await prisma.session.findUnique({
      where: { refreshTokenHash: oldTokenHash },
      select: { id: true, userId: true, isRevoked: true },
    });

    if (!oldSession || oldSession.isRevoked) {
      return false;
    }

    // Revoke old session
    await this.revokeSession(oldSession.id);

    // Create new session
    await this.createSession(oldSession.userId, newRefreshToken, metadata);

    return true;
  }

  /**
   * Revoke a specific session (logout)
   */
  async revokeSession(sessionId: string): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });
  }

  /**
   * Revoke session by refresh token
   */
  async revokeSessionByToken(refreshToken: string): Promise<boolean> {
    const refreshTokenHash = this.hashToken(refreshToken);

    const session = await prisma.session.findUnique({
      where: { refreshTokenHash },
      select: { id: true },
    });

    if (!session) {
      return false;
    }

    await this.revokeSession(session.id);
    return true;
  }

  /**
   * Revoke all sessions for a user (logout from all devices)
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await prisma.session.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });

    return result.count;
  }

  /**
   * Clean up expired sessions (run periodically)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true, lastUsedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, // Delete revoked sessions older than 7 days
        ],
      },
    });

    return result.count;
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(userId: string): Promise<
    Array<{
      id: string;
      createdAt: Date;
      lastUsedAt: Date;
      userAgent: string | null;
      ipAddress: string | null;
    }>
  > {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        createdAt: true,
        lastUsedAt: true,
        userAgent: true,
        ipAddress: true,
      },
      orderBy: {
        lastUsedAt: 'desc',
      },
    });

    return sessions;
  }
}

export const sessionService = new SessionService();



