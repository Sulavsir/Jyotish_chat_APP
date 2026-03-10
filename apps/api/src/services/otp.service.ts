/**
 * OTP Service - Handle all OTP-related business logic
 */

import { prisma } from '@jyotish/database';
import { UserRole } from '@jyotish/shared';
import { encrypt, decrypt, isSmsSendEnabled, isDevelopment } from '../utils';
import { smsService } from './sms.service';
import { OTP_CONFIG } from '../constants';
import type { OTPSession, SendOTPResult, VerifyOTPResult } from '../types';

export class OTPService {
  /**
   * Generate a random 6-digit OTP
   */
  private generateOTP(): string {
    const min = Math.pow(10, OTP_CONFIG.OTP_LENGTH - 1);
    const max = Math.pow(10, OTP_CONFIG.OTP_LENGTH) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  /**
   * Check if phone number has exceeded rate limit
   */
  async checkRateLimit(phoneNumber: string): Promise<boolean> {
    const cutoffTime = new Date(Date.now() - OTP_CONFIG.RATE_LIMIT_HOURS * 60 * 60 * 1000);
    const recentAttempts = await prisma.oTPSession.count({
      where: {
        phoneNumber,
        createdAt: { gte: cutoffTime },
      },
    });

    return recentAttempts >= OTP_CONFIG.RATE_LIMIT_MAX_REQUESTS;
  }

  /**
   * Check if user exists by phone number (CLIENT only)
   */
  async isExistingUser(phoneNumber: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { phone: phoneNumber },
    });
    return !!user;
  }

  /**
   * Check if phone number is already used by any role (CLIENT or ASTROLOGER)
   * Returns the role if exists, null otherwise
   */
  async checkPhoneNumberExists(
    phoneNumber: string
  ): Promise<{ exists: boolean; role?: UserRole.CLIENT | UserRole.ASTROLOGER }> {
    const [user, astrologer] = await Promise.all([
      prisma.user.findUnique({
        where: { phone: phoneNumber },
        select: { id: true, role: true },
      }),
      prisma.astrologer.findUnique({
        where: { phone: phoneNumber },
        select: { id: true },
      }),
    ]);

    if (user) {
      return { exists: true, role: UserRole.CLIENT };
    }

    if (astrologer) {
      return { exists: true, role: UserRole.ASTROLOGER };
    }

    return { exists: false };
  }

  /**
   * Send OTP to phone number
   */
  async sendOTP(phoneNumber: string): Promise<SendOTPResult> {
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + OTP_CONFIG.OTP_EXPIRY_MINUTES * 60 * 1000);
    const isExistingUser = await this.isExistingUser(phoneNumber);

    const otpSession = await prisma.oTPSession.create({
      data: {
        phoneNumber,
        otp: encrypt(otp),
        expiresAt,
      },
    });

    if (isSmsSendEnabled()) {
      try {
        await smsService.sendOTP(phoneNumber, otp);
      } catch (error) {
        console.error('OTP session created but SMS send failed:', error);
      }
    }

    return {
      sessionId: otpSession.id,
      isExistingUser,
      ...(isDevelopment() && { otp }),
    };
  }

  /**
   * Retrieve OTP session by ID
   */
  async getOTPSession(sessionId: string): Promise<OTPSession | null> {
    return await prisma.oTPSession.findUnique({
      where: { id: sessionId },
    });
  }

  /**
   * Verify OTP against session
   */
  async verifyOTP(sessionId: string, phoneNumber: string, otp: string): Promise<VerifyOTPResult> {
    // Get OTP session
    const otpSession = await this.getOTPSession(sessionId);

    if (!otpSession) {
      throw new Error('Invalid or expired OTP session');
    }

    // Check if already verified
    if (otpSession.verified) {
      throw new Error('OTP already used');
    }

    // Check if expired
    if (new Date() > otpSession.expiresAt) {
      throw new Error('OTP has expired');
    }

    // Check phone number matches
    if (otpSession.phoneNumber !== phoneNumber) {
      throw new Error('Phone number mismatch');
    }

    // Check attempts
    if (otpSession.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
      throw new Error('Too many failed attempts');
    }

    // Decrypt and verify OTP
    const decryptedOTP = decrypt(otpSession.otp);
    if (decryptedOTP !== otp) {
      // Increment failed attempts
      await prisma.oTPSession.update({
        where: { id: sessionId },
        data: { attempts: otpSession.attempts + 1 },
      });
      throw new Error('Invalid OTP');
    }

    // Mark as verified
    await prisma.oTPSession.update({
      where: { id: sessionId },
      data: { verified: true },
    });

    return {
      success: true,
      phoneNumber: otpSession.phoneNumber,
    };
  }

  /**
   * Validate OTP without consuming the session.
   * Used for multi-step flows where OTP is verified first,
   * then the session is consumed in a later step.
   */
  async validateOTP(sessionId: string, phoneNumber: string, otp: string): Promise<VerifyOTPResult> {
    const otpSession = await this.getOTPSession(sessionId);

    if (!otpSession) {
      throw new Error('Invalid or expired OTP session');
    }

    if (otpSession.verified) {
      throw new Error('OTP already used');
    }

    if (new Date() > otpSession.expiresAt) {
      throw new Error('OTP has expired');
    }

    if (otpSession.phoneNumber !== phoneNumber) {
      throw new Error('Phone number mismatch');
    }

    if (otpSession.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
      throw new Error('Too many failed attempts');
    }

    const decryptedOTP = decrypt(otpSession.otp);
    if (decryptedOTP !== otp) {
      await prisma.oTPSession.update({
        where: { id: sessionId },
        data: { attempts: otpSession.attempts + 1 },
      });
      throw new Error('Invalid OTP');
    }

    return {
      success: true,
      phoneNumber: otpSession.phoneNumber,
    };
  }

  /**
   * Clean up expired OTP sessions (can be called by a cron job)
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.oTPSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return result.count;
  }
}

export const otpService = new OTPService();
