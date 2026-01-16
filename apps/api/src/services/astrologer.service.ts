/**
 * Astrologer Service - Handle astrologer-related business logic
 * Astrologers can only be created by admins, not through signup
 */

import { prisma } from '@jyotish/database';
import { UserRole, AstrologerCategory } from '@jyotish/shared';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AUTH_CONFIG, HTTP_STATUS, ERROR_CODES } from '../constants';
import { AppError } from '../middleware/error-handler';
import { sessionService } from './session.service';

export class AstrologerService {
  /**
   * Find astrologer by ID
   */
  async findById(id: string) {
    const astrologer = await prisma.astrologer.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        profilePhoto: true,
        bio: true,
        specialization: true,
        experience: true,
        category: true,
        appointmentFee: true,
        rating: true,
        totalConsultations: true,
        isActive: true,
        isOnline: true,
        isVerified: true,
        commissionRate: true,
        languages: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!astrologer) {
      throw new AppError('Astrologer not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    return astrologer;
  }

  /**
   * Find astrologer by phone
   */
  async findByPhone(phone: string) {
    return await prisma.astrologer.findUnique({
      where: { phone },
      select: {
        id: true,
        phone: true,
        email: true,
        password: true,
        name: true,
        profilePhoto: true,
        bio: true,
        specialization: true,
        experience: true,
        rating: true,
        totalConsultations: true,
        isActive: true,
        isOnline: true,
        isVerified: true,
        commissionRate: true,
        languages: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Find astrologer by email
   */
  async findByEmail(email: string) {
    return await prisma.astrologer.findUnique({
      where: { email },
      select: {
        id: true,
        phone: true,
        email: true,
        password: true,
        name: true,
        profilePhoto: true,
        bio: true,
        specialization: true,
        experience: true,
        category: true,
        appointmentFee: true,
        rating: true,
        totalConsultations: true,
        isActive: true,
        isOnline: true,
        isVerified: true,
        commissionRate: true,
        languages: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Create new astrologer (admin only)
   */
  async create(data: {
    phone: string;
    email?: string;
    password: string;
    name: string;
    bio?: string;
    specialization: string[];
    experience?: number;
    category?: AstrologerCategory;
    appointmentFee?: number;
    commissionRate: number;
    languages: string[];
    createdBy: string; // Admin ID
  }) {
    // Check if phone number is already used by a CLIENT
    const existingUser = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (existingUser) {
      throw new AppError(
        'This phone number is already registered as a client account. Please use a different phone number.',
        HTTP_STATUS.CONFLICT,
        ERROR_CODES.PHONE_EXISTS
      );
    }

    // Check if astrologer already exists
    const existingPhone = await prisma.astrologer.findUnique({
      where: { phone: data.phone },
    });

    if (existingPhone) {
      throw new AppError(
        'Astrologer with this phone already exists',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (data.email) {
      const existingEmail = await prisma.astrologer.findUnique({
        where: { email: data.email },
      });

      if (existingEmail) {
        throw new AppError(
          'Astrologer with this email already exists',
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, AUTH_CONFIG.SALT_ROUNDS);

    // Create astrologer
    const astrologer = await prisma.astrologer.create({
      data: {
        phone: data.phone,
        email: data.email,
        password: hashedPassword,
        name: data.name,
        bio: data.bio,
        specialization: data.specialization,
        experience: data.experience,
        category: data.category, // ORDINARY, PROFESSIONAL, PREMIUM
        appointmentFee: data.appointmentFee,
        commissionRate: data.commissionRate,
        languages: data.languages,
        createdBy: data.createdBy,
        isActive: true,
        isVerified: false, // Must be verified by admin
      },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        profilePhoto: true,
        bio: true,
        specialization: true,
        experience: true,
        category: true,
        appointmentFee: true,
        rating: true,
        totalConsultations: true,
        isActive: true,
        isOnline: true,
        isVerified: true,
        commissionRate: true,
        languages: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return astrologer;
  }

  /**
   * Astrologer login with phone/email and password
   */
  async login(identifier: string, password: string, deviceInfo: any) {
    // Find astrologer by phone or email
    let astrologer = await prisma.astrologer.findFirst({
      where: {
        OR: [{ phone: identifier }, { email: identifier }],
      },
      select: {
        id: true,
        phone: true,
        email: true,
        password: true,
        name: true,
        profilePhoto: true,
        bio: true,
        specialization: true,
        experience: true,
        category: true,
        appointmentFee: true,
        rating: true,
        totalConsultations: true,
        isActive: true,
        isOnline: true,
        isVerified: true,
        commissionRate: true,
        languages: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!astrologer) {
      console.log('❌ Astrologer not found for identifier:', identifier);
      throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    }

    console.log('✅ Astrologer found:', astrologer.email, 'Active:', astrologer.isActive);

    if (!astrologer.isActive) {
      throw new AppError('Account is deactivated', HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
    }

    // Verify password
    console.log('🔐 Verifying password for:', astrologer.email);
    const isPasswordValid = await bcrypt.compare(password, astrologer.password);
    console.log('🔐 Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', astrologer.email);
      throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    }

    console.log('✅ Login successful for:', astrologer.email, 'Category:', astrologer.category);

    // Generate tokens with category
    const accessToken = this.generateAccessToken(
      astrologer.id,
      astrologer.phone,
      astrologer.category
    );
    const refreshToken = this.generateRefreshToken(
      astrologer.id,
      astrologer.phone,
      astrologer.category
    );

    // Import device session service
    const { createDeviceSession } = require('./device-session.service');

    // Create session with device tracking
    await createDeviceSession({
      astrologerId: astrologer.id,
      userType: 'ASTROLOGER' as any,
      refreshToken,
      deviceInfo,
      expiresAt: new Date(Date.now() + AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN_MS),
    });

    return {
      astrologer: {
        id: astrologer.id,
        phone: astrologer.phone,
        email: astrologer.email,
        name: astrologer.name,
        profilePhoto: astrologer.profilePhoto,
        bio: astrologer.bio,
        specialization: astrologer.specialization,
        experience: astrologer.experience,
        rating: astrologer.rating,
        category: astrologer.category, // Include category in response
        isActive: astrologer.isActive,
        isOnline: astrologer.isOnline,
        isVerified: astrologer.isVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Generate access token for astrologer (with category encoded)
   */
  private generateAccessToken(astrologerId: string, phone: string, category: string): string {
    const payload = {
      id: astrologerId,
      phone,
      role: 'ASTROLOGER',
      category, // Encode category in token
      type: 'access', // Fixed: lowercase to match auth middleware
    };

    return jwt.sign(payload, AUTH_CONFIG.JWT_SECRET!, {
      expiresIn: `${AUTH_CONFIG.ACCESS_TOKEN_EXPIRES_IN_MINUTES}m`,
      algorithm: AUTH_CONFIG.JWT_ALGORITHM,
    });
  }

  /**
   * Generate refresh token for astrologer (with category encoded)
   */
  private generateRefreshToken(astrologerId: string, phone: string, category: string): string {
    const payload = {
      id: astrologerId,
      phone,
      role: 'ASTROLOGER',
      category, // Encode category in token
      type: 'refresh', // Fixed: lowercase to match auth middleware
    };

    return jwt.sign(payload, AUTH_CONFIG.JWT_SECRET!, {
      expiresIn: `${AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN_DAYS}d`,
      algorithm: AUTH_CONFIG.JWT_ALGORITHM,
    });
  }

  /**
   * Update astrologer details
   */
  async update(
    id: string,
    data: {
      email?: string;
      name?: string;
      bio?: string;
      profilePhoto?: string;
      specialization?: string[];
      experience?: number;
      commissionRate?: number;
      languages?: string[];
    }
  ) {
    const astrologer = await prisma.astrologer.update({
      where: { id },
      data,
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        profilePhoto: true,
        bio: true,
        specialization: true,
        experience: true,
        rating: true,
        totalConsultations: true,
        isActive: true,
        isOnline: true,
        isVerified: true,
        commissionRate: true,
        languages: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return astrologer;
  }

  /**
   * Toggle astrologer active status
   */
  async toggleStatus(id: string) {
    const astrologer = await this.findById(id);

    return await prisma.astrologer.update({
      where: { id },
      data: { isActive: !astrologer.isActive },
    });
  }

  /**
   * Toggle astrologer verified status
   */
  async toggleVerified(id: string) {
    const astrologer = await this.findById(id);

    return await prisma.astrologer.update({
      where: { id },
      data: { isVerified: !astrologer.isVerified },
    });
  }

  /**
   * Update astrologer online status
   */
  async updateOnlineStatus(id: string, isOnline: boolean) {
    return await prisma.astrologer.update({
      where: { id },
      data: { isOnline },
    });
  }

  /**
   * Delete astrologer (soft delete - set inactive)
   */
  async delete(id: string) {
    return await prisma.astrologer.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * List all astrologers with pagination and filters
   */
  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    isVerified?: boolean;
    isOnline?: boolean;
  }) {
    const { page = 1, limit = 10, search, isActive, isVerified, isOnline } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified;
    }

    if (isOnline !== undefined) {
      where.isOnline = isOnline;
    }

    const [astrologers, total] = await Promise.all([
      prisma.astrologer.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          phone: true,
          email: true,
          name: true,
          profilePhoto: true,
          bio: true,
          specialization: true,
          experience: true,
          category: true,
          appointmentFee: true,
          rating: true,
          totalConsultations: true,
          isActive: true,
          isOnline: true,
          isVerified: true,
          commissionRate: true,
          languages: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.astrologer.count({ where }),
    ]);

    return {
      astrologers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get astrologer earnings
   */
  async getEarnings(
    astrologerId: string,
    params: { page?: number; limit?: number; status?: string }
  ) {
    const { page = 1, limit = 10, status } = params;
    const skip = (page - 1) * limit;

    const where: any = { astrologerId };
    if (status) {
      where.status = status;
    }

    const [earnings, total] = await Promise.all([
      prisma.astrologerEarnings.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.astrologerEarnings.count({ where }),
    ]);

    return {
      earnings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Verify password for login
   */
  async verifyPassword(astrologer: any, password: string): Promise<boolean> {
    return await bcrypt.compare(password, astrologer.password);
  }

  /**
   * Change astrologer password
   */
  async changePassword(
    astrologerId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Get astrologer with password
    const astrologer = await prisma.astrologer.findUnique({
      where: { id: astrologerId },
      select: { id: true, password: true },
    });

    if (!astrologer) {
      throw new AppError('Astrologer not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, astrologer.password);
    if (!isPasswordValid) {
      throw new AppError(
        'Current password is incorrect',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.astrologer.update({
      where: { id: astrologerId },
      data: { password: hashedPassword },
    });
  }
}

export const astrologerService = new AstrologerService();
