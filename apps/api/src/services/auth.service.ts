/**
 * Auth Service - Handle authentication business logic
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@jyotish/database';
import { AUTH_CONFIG, HTTP_STATUS, ERROR_CODES, TOKEN_TYPES } from '../constants';
import { AppError } from '../middleware/error-handler';
import { sessionService } from './session.service';
import { toUserResponse } from '../utils';
import { UserRole } from '@jyotish/shared';
import type {
  UserPayload,
  LoginResult,
  TempTokenPayload,
  UserEntity,
  UserResponse,
} from '../types';

export class AuthService {
  /**
   * Generate JWT access token for authenticated user (short-lived)
   */
  generateAccessToken(payload: UserPayload): string {
    const secret = AUTH_CONFIG.JWT_SECRET;
    if (!secret) {
      throw new AppError(
        'JWT_SECRET is not configured',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.SERVER_ERROR
      );
    }
    return jwt.sign({ ...payload, type: TOKEN_TYPES.ACCESS }, secret, {
      expiresIn: `${AUTH_CONFIG.ACCESS_TOKEN_EXPIRES_IN_MINUTES}m`,
    });
  }

  /**
   * Generate JWT refresh token for authenticated user (long-lived)
   */
  generateRefreshToken(payload: UserPayload): string {
    const secret = AUTH_CONFIG.JWT_SECRET;
    if (!secret) {
      throw new AppError(
        'JWT_SECRET is not configured',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.SERVER_ERROR
      );
    }
    return jwt.sign({ ...payload, type: TOKEN_TYPES.REFRESH }, secret, {
      expiresIn: `${AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN_DAYS}d`,
    });
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokens(payload: UserPayload): { accessToken: string; refreshToken: string } {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Legacy method for backward compatibility
   */
  generateToken(payload: UserPayload): string {
    return this.generateAccessToken(payload);
  }

  /**
   * Generate temporary token for new user flow (15 minutes)
   */
  generateTempToken(phoneNumber: string): string {
    const secret = AUTH_CONFIG.JWT_SECRET;
    if (!secret) {
      throw new AppError(
        'JWT_SECRET is not configured',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.SERVER_ERROR
      );
    }
    return jwt.sign({ phoneNumber, type: TOKEN_TYPES.TEMP } as TempTokenPayload, secret, {
      expiresIn: `${AUTH_CONFIG.TEMP_TOKEN_EXPIRES_IN_MINUTES}m`,
    });
  }

  /**
   * Verify and decode temporary token
   */
  verifyTempToken(tempToken: string): TempTokenPayload {
    try {
      const secret = AUTH_CONFIG.JWT_SECRET;
      if (!secret) {
        throw new AppError(
          'JWT_SECRET is not configured',
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          ERROR_CODES.SERVER_ERROR
        );
      }
      const decoded = jwt.verify(tempToken, secret) as TempTokenPayload;

      if (decoded.type !== 'temp') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Verify and decode refresh token
   */
  verifyRefreshToken(refreshToken: string): UserPayload {
    try {
      const secret = AUTH_CONFIG.JWT_SECRET;
      if (!secret) {
        throw new AppError(
          'JWT_SECRET is not configured',
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          ERROR_CODES.SERVER_ERROR
        );
      }
      const decoded = jwt.verify(refreshToken, secret) as UserPayload;

      if (decoded.type !== 'refresh') {
        throw new AppError(
          'Invalid token type',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.UNAUTHORIZED
        );
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(
          'Refresh token expired',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.UNAUTHORIZED
        );
      }
      throw new AppError(
        'Invalid refresh token',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }
  }

  /**
   * Verify access token (for middleware)
   */
  verifyAccessToken(accessToken: string): UserPayload {
    try {
      const secret = AUTH_CONFIG.JWT_SECRET;
      if (!secret) {
        throw new AppError(
          'JWT_SECRET is not configured',
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          ERROR_CODES.SERVER_ERROR
        );
      }
      const decoded = jwt.verify(accessToken, secret) as UserPayload;

      // Access tokens should have type 'access' or no type (for backward compatibility)
      if (decoded.type && decoded.type !== 'access') {
        throw new AppError(
          'Invalid token type',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.UNAUTHORIZED
        );
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(
          'Access token expired',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.UNAUTHORIZED
        );
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError(
          'Invalid access token',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.UNAUTHORIZED
        );
      }
      throw error;
    }
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, AUTH_CONFIG.SALT_ROUNDS);
  }

  /**
   * Compare password with hashed password
   */
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Find user by phone number
   */
  async findUserByPhone(phoneNumber: string): Promise<UserEntity | null> {
    return await prisma.user.findUnique({
      where: { phone: phoneNumber },
    });
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<UserEntity | null> {
    return await prisma.user.findFirst({
      where: { email },
    });
  }

  /**
   * Find user by identifier (email or phone)
   */
  async findUserByIdentifier(identifier: string): Promise<UserEntity | null> {
    const isEmail = identifier.includes('@');

    if (isEmail) {
      return await this.findUserByEmail(identifier);
    }

    // Clean phone number (remove non-digits)
    const cleanPhone = identifier.replace(/\D/g, '');
    return await this.findUserByPhone(cleanPhone);
  }

  /**
   * Login user with phone after OTP verification
   * Creates session with hashed refresh token
   */
  async loginWithPhone(
    phoneNumber: string,
    deviceInfo: any
  ): Promise<LoginResult> {
    const user = await prisma.user.findUnique({
      where: { phone: phoneNumber },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        profilePhoto: true,
        profileCompleted: true,
        password: true, // Include password to check if it's set
        dateOfBirth: true,
        timeOfBirth: true,
        placeOfBirth: true,
        currentAddress: true,
        permanentAddress: true,
        latitude: true,
        longitude: true,
        zodiacSign: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const { accessToken, refreshToken } = this.generateTokens({
      id: user.id,
      phone: user.phone,
      role: user.role as UserRole,
    });

    // Import device session service
    const { createDeviceSession } = require('./device-session.service');
    const { AUTH_CONFIG } = require('../constants');

    // Create session with device tracking
    await createDeviceSession({
      userId: user.id,
      userType: 'CLIENT' as any,
      refreshToken,
      deviceInfo,
      expiresAt: new Date(Date.now() + AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN_MS),
    });

    // Format user response
    const userResponse = toUserResponse(user as UserEntity);

    return {
      accessToken,
      refreshToken,
      user: userResponse,
      token: accessToken, // Legacy support
    };
  }

  /**
   * Login user with password (email or phone + password)
   * Creates session with hashed refresh token
   * Note: This is for CLIENT users only. Astrologers should use astrologerService.login()
   */
  async loginWithPassword(
    identifier: string,
    password: string,
    deviceInfo: any
  ): Promise<LoginResult> {
    // Find user by identifier
    const user = await this.findUserByIdentifier(identifier);

    // Check if user exists
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user has password set
    if (!user.password) {
      throw new AppError(
        'Password not set. Please use OTP login or set a password first.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Ensure only CLIENT role users can login via this endpoint
    if (user.role !== UserRole.CLIENT) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens({
      id: user.id,
      phone: user.phone,
      role: user.role as UserRole,
    });

    // Import device session service
    const { createDeviceSession } = require('./device-session.service');
    const { AUTH_CONFIG } = require('../constants');

    // Create session with device tracking
    await createDeviceSession({
      userId: user.id,
      userType: 'CLIENT' as any,
      refreshToken,
      deviceInfo,
      expiresAt: new Date(Date.now() + AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN_MS),
    });

    // Format user response
    const userResponse = toUserResponse(user);

    return {
      accessToken,
      refreshToken,
      user: userResponse,
      token: accessToken, // Legacy support
    };
  }

  /**
   * Format user response (remove sensitive fields, add phoneNumber and hasPassword)
   */
  formatUserResponse(user: UserEntity): UserResponse {
    return toUserResponse({
      ...user,
      // Ensure all User fields are present for compatibility
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      latitude: user.latitude,
      longitude: user.longitude,
    } as any); // Cast needed for UserEntity to User conversion
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    if (!user.password) {
      throw new AppError(
        'Password not set for this account. Please use OTP login.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Verify current password
    const isPasswordValid = await this.comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError(
        'Current password is incorrect',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /**
   * Set password for existing user who doesn't have one
   */
  async setPasswordForExistingUser(userId: string, password: string): Promise<void> {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    if (user.password) {
      throw new AppError(
        'Password already set. Use change password instead.',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(password);

    // Set password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}

export const authService = new AuthService();
