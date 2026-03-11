/**
 * Auth Controller - Handle authentication requests
 * Controllers should be thin - only handle request validation, input handling, and responses
 * All business logic is delegated to services
 * Validation is handled at route level via middleware
 * Errors are handled by global error handler
 */

import { Response, NextFunction } from 'express';
import { UserRole } from '@jyotish/shared';
import { prisma } from '@jyotish/database';
import { AuthRequest } from '../types';
import {
  sendSuccess,
  setAuthCookies,
  clearAuthCookies,
  logUserLogin,
  logUserLogout,
  logUserRegister,
  isProduction,
  isDevelopment,
} from '../utils';
import { HTTP_STATUS, ERROR_CODES, OTP_CONFIG, PASSWORD_RESET_ACTOR } from '../constants';
import {
  otpService,
  authService,
  userService,
  sessionService,
  emailService,
  passwordResetService,
} from '../services';
import { AppError } from '../middleware/error-handler';
import { getClientIp } from '../utils/request-utils';

/**
 * Check if phone number exists
 * POST /api/v1/auth/check-phone
 */
export async function checkPhone(req: AuthRequest, res: Response, next: NextFunction) {
  const { phoneNumber } = req.body;

  // Check if user exists via service
  const exists = await userService.userExists(phoneNumber);

  return sendSuccess(res, {
    exists,
    message: exists ? 'Phone number found' : 'New user',
  });
}

/**
 * Send OTP to phone number (for both new and existing users)
 * POST /api/v1/auth/send-otp
 * Unified OTP flow - no need to check if user exists first
 */
export async function sendOTP(req: AuthRequest, res: Response, next: NextFunction) {
  const { phoneNumber } = req.body;

  // Check if phone number belongs to an ASTROLOGER (they can't use client OTP login)
  const phoneCheck = await otpService.checkPhoneNumberExists(phoneNumber);

  if (phoneCheck.exists && phoneCheck.role === UserRole.ASTROLOGER) {
    throw new AppError(
      'This phone number is registered as an astrologer account. Please use the astrologer login page.',
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.PHONE_EXISTS
    );
  }

  if (isProduction()) {
    const isRateLimited = await otpService.checkRateLimit(phoneNumber);
    if (isRateLimited) {
      throw new AppError(
        'Too many OTP requests. Please try again later.',
        HTTP_STATUS.TOO_MANY_REQUESTS,
        ERROR_CODES.RATE_LIMIT_EXCEEDED
      );
    }
  }

  const result = await otpService.sendOTP(phoneNumber);

  return sendSuccess(res, {
    sessionId: result.sessionId,
    isExistingUser: result.isExistingUser,
    message: 'OTP sent successfully',
    expiresIn: OTP_CONFIG.OTP_EXPIRY_MINUTES * 60,
    ...(result.otp && { otp: result.otp }),
  });
}

/**
 * Verify OTP
 * POST /api/v1/auth/verify-otp
 * - Creates user if new (without password)
 * - Logs in existing user
 * - Returns token and user for both cases
 */
export async function verifyOTP(req: AuthRequest, res: Response, next: NextFunction) {
  const { sessionId, phoneNumber, otp, role } = req.body;

  // Verify OTP via service
  const verifyResult = await otpService.verifyOTP(sessionId, phoneNumber, otp);

  // Check if phone number is already registered (in either User or Astrologer table)
  const phoneCheck = await otpService.checkPhoneNumberExists(verifyResult.phoneNumber);

  if (phoneCheck.exists) {
    // Phone number already exists
    if (phoneCheck.role === UserRole.CLIENT) {
      // Extract device information
      const { extractDeviceInfo } = require('../utils/device-utils');
      const deviceInfo = extractDeviceInfo(req);

      // Existing CLIENT - Log them in
      const loginResult = await authService.loginWithPhone(verifyResult.phoneNumber, deviceInfo);

      // Set both tokens as httpOnly cookies
      setAuthCookies(res, loginResult.accessToken, loginResult.refreshToken);

      // Log audit event
      await logUserLogin(loginResult.user.id, req, {
        loginMethod: 'OTP',
        phoneNumber: verifyResult.phoneNumber,
        deviceType: deviceInfo.deviceType,
        deviceName: deviceInfo.deviceName,
      });

      return sendSuccess(res, {
        isNewUser: false,
        message: 'Login successful',
      });
    } else if (phoneCheck.role === UserRole.ASTROLOGER) {
      // Phone number is registered as ASTROLOGER - Cannot use for client login/registration
      throw new AppError(
        'This phone number is registered as an astrologer account. Please use the astrologer login page.',
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.PHONE_EXISTS
      );
    }
  }

  // NEW USER - Create account without password
  // Use provided role or default to CLIENT
  const userRole = (role as UserRole) || UserRole.CLIENT;

  // Double-check: Don't allow creating CLIENT accounts via this endpoint if trying to use ASTROLOGER role
  if (userRole === UserRole.ASTROLOGER) {
    throw new AppError(
      'Astrologer accounts cannot be created through this endpoint. Please contact admin.',
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.FORBIDDEN
    );
  }

  const createResult = await userService.createUserWithoutPassword(
    verifyResult.phoneNumber,
    userRole
  );

  // Set both tokens as httpOnly cookies
  setAuthCookies(res, createResult.accessToken, createResult.refreshToken);

  // Log audit event
  await logUserRegister(createResult.user.id, req, {
    phoneNumber: verifyResult.phoneNumber,
    method: 'OTP',
    role: userRole,
  });

  // Emit real-time stats update to admin
  const { AdminStatsEmitter } = require('../utils/admin-stats-emitter');
  AdminStatsEmitter.emitNewUser();

  return sendSuccess(res, {
    isNewUser: true,
    message: 'Account created successfully. You can set a password later.',
  });
}

/**
 * Set password for new user (after OTP verification)
 * POST /api/v1/auth/set-password
 */
export async function setPassword(req: AuthRequest, res: Response, next: NextFunction) {
  const { tempToken, password } = req.body;

  // Verify temp token
  const decoded = authService.verifyTempToken(tempToken);

  // Check if user already exists
  const exists = await userService.userExists(decoded.phoneNumber);
  if (exists) {
    throw new AppError('User already exists', HTTP_STATUS.CONFLICT, ERROR_CODES.USER_EXISTS);
  }

  // Create user via service
  const result = await userService.createUser({
    phoneNumber: decoded.phoneNumber,
    password,
  });

  // Set both tokens as httpOnly cookies
  setAuthCookies(res, result.accessToken, result.refreshToken);

  return sendSuccess(
    res,
    {
      message: 'Account created successfully.',
    },
    HTTP_STATUS.CREATED
  );
}

/**
 * Login user with email/phone + password
 * POST /api/v1/auth/login
 * Supports both email and phone number login
 * Requires: deviceId in body or X-Device-Id header
 */
export async function login(req: AuthRequest, res: Response, next: NextFunction) {
  const { identifier, password } = req.body;

  // Extract device information
  const { extractDeviceInfo } = require('../utils/device-utils');
  const deviceInfo = extractDeviceInfo(req);

  // Login via service with device tracking
  const result = await authService.loginWithPassword(identifier, password, deviceInfo);

  // Set both tokens as httpOnly cookies
  setAuthCookies(res, result.accessToken, result.refreshToken);

  // Log audit event
  await logUserLogin(result.user.id, req, {
    loginMethod: 'password',
    identifier,
    deviceType: deviceInfo.deviceType,
    deviceName: deviceInfo.deviceName,
  });

  return sendSuccess(res, {
    message: 'Login successful.',
  });
}

/**
 * Request OTP for passwordless login (existing users only)
 * POST /api/v1/auth/login-with-otp
 */
export async function requestLoginOTP(req: AuthRequest, res: Response, next: NextFunction) {
  const { phoneNumber } = req.body;

  // Check if phone number belongs to an ASTROLOGER (they can't use client OTP login)
  const phoneCheck = await otpService.checkPhoneNumberExists(phoneNumber);

  if (phoneCheck.exists && phoneCheck.role === UserRole.ASTROLOGER) {
    throw new AppError(
      'This phone number is registered as an astrologer account. Please use the astrologer login page.',
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.PHONE_EXISTS
    );
  }

  // Check if user exists in CLIENT table
  const exists = await userService.userExists(phoneNumber);
  if (!exists) {
    throw new AppError(
      'No account found with this phone number',
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.USER_NOT_FOUND
    );
  }

  // Check rate limiting
  if (isProduction()) {
    const isRateLimited = await otpService.checkRateLimit(phoneNumber);
    if (isRateLimited) {
      throw new AppError(
        'Too many OTP requests. Please try again later.',
        HTTP_STATUS.TOO_MANY_REQUESTS,
        ERROR_CODES.RATE_LIMIT_EXCEEDED
      );
    }
  }

  const result = await otpService.sendOTP(phoneNumber);

  return sendSuccess(res, {
    sessionId: result.sessionId,
    message: 'OTP sent successfully',
    expiresIn: OTP_CONFIG.OTP_EXPIRY_MINUTES * 60, // Return expiry in seconds
    ...(isDevelopment() && result.otp && { otp: result.otp }),
  });
}

/**
 * Verify OTP and login (passwordless)
 * POST /api/v1/auth/verify-login-otp
 * Requires: deviceId in body or X-Device-Id header
 */
export async function verifyLoginOTP(req: AuthRequest, res: Response, next: NextFunction) {
  const { sessionId, phoneNumber, otp } = req.body;

  // Extract device information
  const { extractDeviceInfo } = require('../utils/device-utils');
  const deviceInfo = extractDeviceInfo(req);

  // Verify OTP via service
  const verifyResult = await otpService.verifyOTP(sessionId, phoneNumber, otp);

  // Login user via service with device tracking
  const loginResult = await authService.loginWithPhone(verifyResult.phoneNumber, deviceInfo);

  // Set both tokens as httpOnly cookies
  setAuthCookies(res, loginResult.accessToken, loginResult.refreshToken);

  return sendSuccess(res, {
    message: 'Login successful.',
  });
}

/**
 * Setup user profile (after account creation)
 * POST /api/v1/users/profile-setup
 */
export async function profileSetup(req: AuthRequest, res: Response, next: NextFunction) {
  const debug = !isProduction();
  // Check authentication
  if (!req.user?.id) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }

  // Handle profile photo if uploaded (multer middleware adds 'file' property)
  // @ts-ignore - multer adds 'file' property
  const profilePhoto = req.file?.path || undefined;

  if (debug) {
    console.log('[users/profile-setup] incoming body:', req.body);
    console.log(
      '[users/profile-setup] file:',
      req.file ? { path: req.file.path, mimetype: req.file.mimetype } : null
    );
  }

  // Setup profile via service
  const user = await userService.setupProfile(req.user.id, {
    ...req.body,
    profilePhoto,
  });

  if (debug) {
    console.log('[users/profile-setup] response:', {
      id: user.id,
      zodiacSign: (user as any).zodiacSign,
      gender: (user as any).gender,
      profileCompleted: (user as any).profileCompleted,
    });
  }

  return sendSuccess(res, {
    user,
    message: 'Profile completed successfully',
  });
}

/**
 * Legacy register endpoint (deprecated)
 */
export async function register(req: AuthRequest, res: Response, next: NextFunction) {
  throw new AppError(
    'This endpoint is deprecated. Please use phone-based authentication.',
    HTTP_STATUS.GONE,
    ERROR_CODES.DEPRECATED
  );
}

/**
 * Change password
 * POST /api/v1/auth/change-password
 */
export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError(
      'User not authenticated',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.UNAUTHORIZED
    );
  }

  // Change password via service
  await authService.changePassword(userId, currentPassword, newPassword);

  // Fetch updated user to return hasPassword: true
  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      profilePhoto: true,
      dateOfBirth: true,
      timeOfBirth: true,
      placeOfBirth: true,
      currentAddress: true,
      permanentAddress: true,
      zodiacSign: true,
      latitude: true,
      longitude: true,
      password: true,
      profileCompleted: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Format response
  const { phone, password, ...userWithoutSensitiveData } = updatedUser!;
  const formattedUser = {
    ...userWithoutSensitiveData,
    phoneNumber: phone,
    hasPassword: !!password,
  };

  return sendSuccess(res, {
    message: 'Password changed successfully',
    user: formattedUser,
  });
}

/**
 * Set password for existing user who doesn't have one
 * POST /api/v1/auth/set-password-existing
 */
export async function setPasswordForExistingUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const { password } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError(
      'User not authenticated',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.UNAUTHORIZED
    );
  }

  // Set password via service
  await authService.setPasswordForExistingUser(userId, password);

  // Fetch updated user to return hasPassword: true
  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      profilePhoto: true,
      dateOfBirth: true,
      timeOfBirth: true,
      placeOfBirth: true,
      currentAddress: true,
      permanentAddress: true,
      zodiacSign: true,
      latitude: true,
      longitude: true,
      password: true,
      profileCompleted: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Format response
  const { phone, password: hashedPassword, ...userWithoutSensitiveData } = updatedUser!;
  const formattedUser = {
    ...userWithoutSensitiveData,
    phoneNumber: phone,
    hasPassword: !!hashedPassword,
  };

  return sendSuccess(res, {
    message: 'Password set successfully',
    user: formattedUser,
  });
}

/**
 * Request password reset (client only – User table).
 * POST /api/v1/auth/forgot-password
 */
export async function requestPasswordReset(req: AuthRequest, res: Response, next: NextFunction) {
  const { identifier } = req.body as { identifier: string };
  const result = await passwordResetService.handleRequestPasswordReset(
    identifier.trim(),
    PASSWORD_RESET_ACTOR.USER
  );
  return sendSuccess(res, result);
}

/**
 * Reset password using email token (client only – User table).
 * POST /api/v1/auth/reset-password-token
 */
export async function resetPasswordWithToken(req: AuthRequest, res: Response, next: NextFunction) {
  const { token, password } = req.body as { token: string; password: string };
  await passwordResetService.handleResetPasswordWithToken(
    token,
    password,
    PASSWORD_RESET_ACTOR.USER
  );
  return sendSuccess(res, {
    message: 'Password has been reset successfully. You can now log in with your new password.',
  });
}

/**
 * Reset password using phone OTP (client only – User table).
 * POST /api/v1/auth/reset-password-otp
 */
export async function resetPasswordWithOTP(req: AuthRequest, res: Response, next: NextFunction) {
  const { phoneNumber, otp, sessionId, password } = req.body as {
    phoneNumber: string;
    otp: string;
    sessionId: string;
    password: string;
  };
  await passwordResetService.handleResetPasswordWithOtp(
    phoneNumber,
    otp,
    sessionId,
    password,
    PASSWORD_RESET_ACTOR.USER
  );
  return sendSuccess(res, {
    message: 'Password has been reset successfully. You can now log in with your new password.',
  });
}

/**
 * Verify OTP for password reset without consuming the session.
 * POST /api/v1/auth/verify-password-reset-otp
 */
export async function verifyPasswordResetOtp(req: AuthRequest, res: Response, next: NextFunction) {
  const { phoneNumber, otp, sessionId } = req.body as {
    phoneNumber: string;
    otp: string;
    sessionId: string;
  };
  await otpService.validateOTP(sessionId, phoneNumber, otp);
  return sendSuccess(res, {
    valid: true,
    message: 'OTP verified successfully.',
  });
}

/**
 * Logout user
 * POST /api/v1/auth/logout
 *
 * Security features:
 * - Revokes refresh token in session
 * - Marks session as invalid
 * - Client clears access token
 */
export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  // Get refresh token from cookie
  const refreshToken = req.cookies.refreshToken;

  // Log audit event before clearing (while we still have user info)
  if (req.user?.id) {
    await logUserLogout(req.user.id, req);
  }

  // Clear all auth cookies
  clearAuthCookies(res);

  if (!refreshToken) {
    // Even if no refresh token provided, return success (client-side logout)
    return sendSuccess(res, {
      message: 'Logged out successfully',
    });
  }

  // Revoke the refresh token session
  try {
    await sessionService.revokeSessionByToken(refreshToken);
  } catch (error) {
    // Log error but still return success - cookies are cleared
    console.error('Error revoking session:', error);
  }

  return sendSuccess(res, {
    message: 'Logged out successfully',
  });
}

/**
 * Logout from all devices
 * POST /api/v1/auth/logout-all
 *
 * Revokes all refresh tokens for the authenticated user
 */
export async function logoutAll(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError(
      'User not authenticated',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.UNAUTHORIZED
    );
  }

  // Clear cookies on this device
  clearAuthCookies(res);

  // Revoke all sessions for this user (all devices)
  const count = await sessionService.revokeAllUserSessions(userId);

  return sendSuccess(res, {
    message: `Logged out from ${count} device(s) successfully`,
    devicesLoggedOut: count,
  });
}

/**
 * Refresh access token using refresh token
 * POST /api/v1/auth/refresh
 *
 * Security features:
 * - Validates refresh token from session (hashed)
 * - One-time use: Rotates refresh token on every use
 * - Revokes old session, creates new one
 */
export async function refreshToken(req: AuthRequest, res: Response, next: NextFunction) {
  // Get refresh token from cookie
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    clearAuthCookies(res);
    throw new AppError(
      'Refresh token is required',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.UNAUTHORIZED
    );
  }

  // Validate refresh token from session (checks hash, expiry, revocation)
  const session = await sessionService.validateRefreshToken(refreshToken);

  if (!session) {
    // Clear invalid cookies
    clearAuthCookies(res);
    throw new AppError(
      'Invalid or expired refresh token',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.UNAUTHORIZED
    );
  }

  // Verify JWT signature and get user data
  const decoded = authService.verifyRefreshToken(refreshToken);

  if (decoded.role === UserRole.ASTROLOGER) {
    const astrologer = await prisma?.astrologer.findUnique({
      where: { id: decoded.id },
      select: { id: true },
    });
    if (!astrologer) {
      clearAuthCookies(res);
      throw new AppError(
        'Astrologer not found',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }
  } else {
    // Support both phone-based and email-only (Google OAuth) users
    let userFound = false;
    if (decoded.phone) {
      userFound = await userService.userExists(decoded.phone);
    }
    if (!userFound) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true },
      });
      userFound = !!user;
    }
    if (!userFound) {
      clearAuthCookies(res);
      throw new AppError('User not found', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    }
  }

  // Generate new token pair (works for both users and astrologers)
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = authService.generateTokens(
    {
      id: decoded.id,
      phone: decoded.phone,
      role: decoded.role,
    }
  );

  // Rotate refresh token (one-time use)
  // Revoke old session and create new one
  const metadata = {
    userAgent: req.headers['user-agent'],
    ipAddress: getClientIp(req) ?? req.socket?.remoteAddress,
  };

  const rotated = await sessionService.rotateRefreshToken(refreshToken, newRefreshToken, metadata);

  if (!rotated) {
    throw new AppError(
      'Failed to rotate refresh token',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.SERVER_ERROR
    );
  }

  // Set new tokens as httpOnly cookies
  setAuthCookies(res, newAccessToken, newRefreshToken);

  return sendSuccess(res, {
    message: 'Tokens refreshed successfully',
  });
}
