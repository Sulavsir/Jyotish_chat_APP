/**
 * User Service - Handle user-related business logic
 */

import { prisma } from '@jyotish/database';
import { ACTIVE_CLIENT_USER_WHERE } from '../constants/user.constants';
import { UserRole, getZodiacSign } from '@jyotish/shared';
import { authService } from './auth.service';
import { sessionService } from './session.service';
import { toUserResponse } from '../utils';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { isPrismaUniqueConstraintViolation } from '../utils/prisma-error.utils';
import type {
  CreateUserData,
  CreateUserResult,
  ProfileSetupData,
  UserResponse,
  UserEntity,
} from '../types';

export class UserService {
  /**
   * Check if user exists by phone
   */
  async userExists(phoneNumber: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: { phone: phoneNumber, ...ACTIVE_CLIENT_USER_WHERE },
    });
    return !!user;
  }

  /**
   * Create new user with phone and password
   * Creates session with hashed refresh token
   */
  async createUser(
    data: CreateUserData,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<CreateUserResult> {
    const { phoneNumber, password } = data;

    // Hash password
    const hashedPassword = await authService.hashPassword(password);

    let user;
    try {
      user = await prisma.user.create({
        data: {
          phone: phoneNumber,
          password: hashedPassword,
          profileCompleted: false,
        },
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
          password: true,
          dateOfBirth: true,
          timeOfBirth: true,
          placeOfBirth: true,
          currentAddress: true,
          permanentAddress: true,
          latitude: true,
          longitude: true,
          zodiacSign: true,
          gender: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (e) {
      if (isPrismaUniqueConstraintViolation(e)) {
        throw new AppError(
          'An account with this phone number already exists',
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.USER_EXISTS
        );
      }
      throw e;
    }

    // Generate auth tokens
    const { accessToken, refreshToken } = authService.generateTokens({
      id: user.id,
      phone: user.phone,
      role: user.role as UserRole,
    });

    // Store refresh token in session (hashed)
    await sessionService.createSession(user.id, refreshToken, metadata);

    // Format user response
    const userResponse = authService.formatUserResponse(user as UserEntity);

    return {
      accessToken,
      refreshToken,
      user: userResponse,
      token: accessToken, // Legacy support
    };
  }

  /**
   * Create new user without password (OTP-only signup)
   * Creates session with hashed refresh token
   */
  async createUserWithoutPassword(
    phoneNumber: string,
    role: UserRole = UserRole.CLIENT,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<CreateUserResult> {
    // Check if phone number is already used by an ASTROLOGER
    const existingAstrologer = await prisma.astrologer.findUnique({
      where: { phone: phoneNumber },
    });

    if (existingAstrologer) {
      throw new Error(
        'This phone number is registered as an astrologer account. Please use the astrologer login page.'
      );
    }

    let user;
    try {
      user = await prisma.user.create({
        data: {
          phone: phoneNumber,
          password: null,
          profileCompleted: false,
          role,
        },
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
          password: true,
          dateOfBirth: true,
          timeOfBirth: true,
          placeOfBirth: true,
          currentAddress: true,
          permanentAddress: true,
          latitude: true,
          longitude: true,
          zodiacSign: true,
          gender: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (e) {
      if (isPrismaUniqueConstraintViolation(e)) {
        throw new AppError(
          'An account with this phone number already exists',
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.USER_EXISTS
        );
      }
      throw e;
    }

    // Generate auth tokens
    const { accessToken, refreshToken } = authService.generateTokens({
      id: user.id,
      phone: user.phone,
      role: user.role as UserRole,
    });

    // Store refresh token in session (hashed)
    await sessionService.createSession(user.id, refreshToken, metadata);

    // Format user response
    const userResponse = authService.formatUserResponse(user as UserEntity);

    return {
      accessToken,
      refreshToken,
      user: userResponse,
      token: accessToken, // Legacy support
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserResponse | null> {
    const user = await prisma.user.findFirst({
      where: { id: userId, ...ACTIVE_CLIENT_USER_WHERE },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        profilePhoto: true,
        password: true, // Include to check if password is set
        dateOfBirth: true,
        timeOfBirth: true,
        placeOfBirth: true,
        currentAddress: true,
        permanentAddress: true,
        latitude: true,
        longitude: true,
        zodiacSign: true,
        profileCompleted: true,
        isOnline: true,
        coins: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) return null;

    return toUserResponse(user as UserEntity);
  }

  /**
   * Setup/complete user profile
   */
  async setupProfile(userId: string, data: ProfileSetupData): Promise<UserResponse> {
    const existing = await prisma.user.findFirst({
      where: { id: userId, ...ACTIVE_CLIENT_USER_WHERE },
      select: { email: true, name: true },
    });
    if (!existing) {
      throw new Error('User not found');
    }

    const incomingEmail = data.email;
    const resolvedEmail =
      incomingEmail !== undefined && incomingEmail !== null && String(incomingEmail).trim() !== ''
        ? String(incomingEmail).trim()
        : existing.email;

    // Same idea as email: keep Google/previous name if the client omits or sends empty (optional field paths / bad payloads).
    const incomingNameTrimmed =
      data.name !== undefined && data.name !== null ? String(data.name).trim() : '';
    const resolvedName =
      incomingNameTrimmed !== '' ? incomingNameTrimmed : (existing.name ?? undefined);

    const placeComplete =
      (!!data.placeOfBirth && data.placeOfBirth.trim().length > 0) ||
      (data.placeOfBirthType === 'NEPAL' &&
        !!data.placeOfBirthPradeshId &&
        !!data.placeOfBirthDistrictId &&
        !!data.placeOfBirthLocation &&
        data.placeOfBirthLocation.trim().length > 0);
    const isProfileComplete =
      !!resolvedName &&
      resolvedName.trim().length > 0 &&
      !!data.dateOfBirth &&
      !!data.timeOfBirth &&
      data.timeOfBirth.trim().length > 0 &&
      placeComplete;

    // Accept common Flutter date formats like "YYYY/MM/DD" by normalizing to ISO-ish.
    const dobRaw = data.dateOfBirth instanceof Date ? data.dateOfBirth : String(data.dateOfBirth);
    const normalizedDob =
      typeof dobRaw === 'string' && dobRaw.includes('/') ? dobRaw.replace(/\//g, '-') : dobRaw;
    const dob = new Date(normalizedDob);
    if (Number.isNaN(dob.getTime())) {
      throw new Error('Invalid dateOfBirth. Expected YYYY-MM-DD.');
    }

    // If the client doesn't send it, keep it null (so we can detect missing payloads).
    const rawZodiac = data.zodiacSign as string | null | undefined;
    const resolvedZodiacSign = rawZodiac && rawZodiac.trim() !== '' ? rawZodiac : null;

    let placeOfBirthValue: string | null = (data.placeOfBirth && data.placeOfBirth.trim()) || null;
    if (
      !placeOfBirthValue &&
      data.placeOfBirthType === 'NEPAL' &&
      data.placeOfBirthDistrictId &&
      data.placeOfBirthPradeshId &&
      'nepalGeography' in prisma
    ) {
      const [district, province] = await Promise.all([
        (prisma as any).nepalGeography.findUnique({
          where: { id: data.placeOfBirthDistrictId },
          select: { nameEn: true },
        }),
        (prisma as any).nepalGeography.findUnique({
          where: { id: data.placeOfBirthPradeshId },
          select: { nameEn: true },
        }),
      ]);
      const parts = [
        province?.nameEn || '',
        district?.nameEn || '',
        (data.placeOfBirthLocation && data.placeOfBirthLocation.trim()) || '',
      ].filter(Boolean);
      placeOfBirthValue = parts.length > 0 ? parts.join(', ') : null;
    }

    const user = await prisma.user.update({
      where: { id: userId, ...ACTIVE_CLIENT_USER_WHERE },
      data: {
        ...(resolvedName !== undefined && { name: resolvedName }),
        email: resolvedEmail,
        dateOfBirth: dob,
        zodiacSign: resolvedZodiacSign as any,
        timeOfBirth: data.timeOfBirth,
        placeOfBirth: placeOfBirthValue,
        placeOfBirthType: data.placeOfBirthType || null,
        placeOfBirthPradeshId: data.placeOfBirthPradeshId || null,
        placeOfBirthDistrictId: data.placeOfBirthDistrictId || null,
        placeOfBirthLocation: data.placeOfBirthLocation || null,
        currentAddress: data.currentAddress,
        permanentAddress: data.permanentAddress,
        gender:
          (data.gender as string | null | undefined) && (data.gender as string).trim() !== ''
            ? data.gender
            : null,
        profileCompleted: isProfileComplete,
        ...(data.profilePhoto && { profilePhoto: data.profilePhoto }),
      },
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
        password: true,
        dateOfBirth: true,
        timeOfBirth: true,
        placeOfBirth: true,
        placeOfBirthType: true,
        placeOfBirthPradeshId: true,
        placeOfBirthDistrictId: true,
        placeOfBirthLocation: true,
        currentAddress: true,
        permanentAddress: true,
        latitude: true,
        longitude: true,
        zodiacSign: true,
        gender: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Format user response
    return authService.formatUserResponse(user as unknown as UserEntity);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: Partial<ProfileSetupData>): Promise<UserResponse> {
    const updateData: Record<string, unknown> = { ...data };

    if (data.dateOfBirth) {
      updateData.dateOfBirth = new Date(data.dateOfBirth as string | Date);
    }
    if (data.placeOfBirthPradeshId === undefined) delete updateData.placeOfBirthPradeshId;
    if (data.placeOfBirthDistrictId === undefined) delete updateData.placeOfBirthDistrictId;
    if (data.placeOfBirthLocation === undefined) delete updateData.placeOfBirthLocation;

    const user = await prisma.user.update({
      where: { id: userId, ...ACTIVE_CLIENT_USER_WHERE },
      data: updateData,
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
        password: true,
        dateOfBirth: true,
        timeOfBirth: true,
        placeOfBirth: true,
        placeOfBirthType: true,
        placeOfBirthPradeshId: true,
        placeOfBirthDistrictId: true,
        placeOfBirthLocation: true,
        currentAddress: true,
        permanentAddress: true,
        latitude: true,
        longitude: true,
        zodiacSign: true,
        gender: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return authService.formatUserResponse(user as UserEntity);
  }

  /**
   * Delete user (soft delete by marking inactive)
   */
  async deleteUser(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }
}

export const userService = new UserService();
