/**
 * User Service - Handle user-related business logic
 */

import { prisma, UserRole } from '@jyotish/database';
import { authService } from './auth.service';
import { sessionService } from './session.service';
import { toUserResponse } from '../utils';
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
    const user = await prisma.user.findUnique({
      where: { phone: phoneNumber },
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

    // Check if user already exists
    const exists = await this.userExists(phoneNumber);
    if (exists) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await authService.hashPassword(password);

    // Create user
    const user = await prisma.user.create({
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
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate auth tokens
    const { accessToken, refreshToken } = authService.generateTokens({
      id: user.id,
      phone: user.phone,
      role: user.role,
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
    // Check if user already exists
    const exists = await this.userExists(phoneNumber);
    if (exists) {
      throw new Error('User already exists');
    }

    // Create user without password
    const user = await prisma.user.create({
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
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate auth tokens
    const { accessToken, refreshToken } = authService.generateTokens({
      id: user.id,
      phone: user.phone,
      role: user.role,
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) return null;

    return toUserResponse(user);
  }

  /**
   * Setup/complete user profile
   */
  async setupProfile(userId: string, data: ProfileSetupData): Promise<UserResponse> {
    // Update user profile
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        dateOfBirth: new Date(data.dateOfBirth),
        timeOfBirth: data.timeOfBirth,
        placeOfBirth: data.placeOfBirth,
        currentAddress: data.currentAddress,
        permanentAddress: data.permanentAddress,
        profileCompleted: true,
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
        currentAddress: true,
        permanentAddress: true,
        latitude: true,
        longitude: true,
        zodiacSign: true,
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

    // Convert dateOfBirth to Date if provided
    if (data.dateOfBirth) {
      updateData.dateOfBirth = new Date(data.dateOfBirth);
      delete updateData.dateOfBirth;
      updateData.dateOfBirth = new Date(data.dateOfBirth);
    }

    const user = await prisma.user.update({
      where: { id: userId },
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
        currentAddress: true,
        permanentAddress: true,
        latitude: true,
        longitude: true,
        zodiacSign: true,
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
