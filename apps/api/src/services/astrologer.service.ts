import { prisma, Gender } from '@jyotish/database';
import { UserRole, AstrologerCategory } from '@jyotish/shared';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AUTH_CONFIG, HTTP_STATUS, ERROR_CODES } from '../constants';
import {
  ASTROLOGER_ACCOUNT_STATUS,
  ASTROLOGER_CREATED_BY,
} from '../constants/astrologer.constants';
import { AppError } from '../middleware/error-handler';
import { sessionService } from './session.service';
import { emailService } from './email.service';
import { smsService } from './sms.service';
import { isNepaliPhoneNumber } from '../utils/phone.utils';

export class AstrologerService {
  /**
   * Find astrologer by ID (excludes soft-deleted)
   */
  async findById(id: string) {
    const astrologer = await prisma.astrologer.findFirst({
      where: { id, isDeleted: false },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        profilePhoto: true,
        address: true,
        bio: true,
        specialization: true,
        experience: true,
        category: true,
        appointmentFee: true,
        chatMessageFee: true,
        proofOfAstrology: true,
        rating: true,
        totalConsultations: true,
        isActive: true,
        isOnline: true,
        isVerified: true,
        commissionRate: true,
        inhouseAstrologer: true,
        languages: true,
        gender: true,
        country: true,
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
   * Find astrologer by phone (excludes soft-deleted)
   */
  async findByPhone(phone: string) {
    return await prisma.astrologer.findFirst({
      where: { phone, isDeleted: false },
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
        inhouseAstrologer: true,
        languages: true,
        gender: true,
        country: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Find astrologer by email (excludes soft-deleted)
   */
  async findByEmail(email: string) {
    const trimmed = email.trim();
    if (!trimmed) return null;
    return await prisma.astrologer.findFirst({
      where: { email: { equals: trimmed, mode: 'insensitive' }, isDeleted: false },
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
        chatMessageFee: true,
        rating: true,
        totalConsultations: true,
        isActive: true,
        isOnline: true,
        isVerified: true,
        commissionRate: true,
        inhouseAstrologer: true,
        languages: true,
        gender: true,
        country: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Find astrologer by identifier (email or phone) – Astrologer table only, for forgot-password.
   */
  async findAstrologerByIdentifier(identifier: string) {
    const isEmail = identifier.includes('@');
    if (isEmail) {
      return await this.findByEmail(identifier.trim());
    }
    const cleaned = identifier.replace(/\D/g, '');
    return await this.findByPhone(cleaned);
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
    chatMessageFee?: number | null;
    commissionRate: number;
    languages: string[];
    inhouseAstrologer?: boolean;
    gender?: Gender;
    country?: string | null;
    createdBy: string; // Admin ID
    proofOfAstrology?: string; // File URL for proof document
    profilePhoto?: string | null;
    address?: string | null;
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

    // Check if astrologer already exists (only non-deleted)
    const existingPhone = await prisma.astrologer.findFirst({
      where: { phone: data.phone, isDeleted: false },
    });

    if (existingPhone) {
      throw new AppError(
        'Astrologer with this phone already exists',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (data.email) {
      const existingEmail = await prisma.astrologer.findFirst({
        where: { email: data.email, isDeleted: false },
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
        chatMessageFee: data.chatMessageFee ?? null,
        commissionRate: data.commissionRate,
        languages: data.languages,
        inhouseAstrologer: data.inhouseAstrologer ?? false,
        gender: data.gender ?? null,
        country: data.country ?? null,
        createdBy: data.createdBy,
        proofOfAstrology: data.proofOfAstrology || null,
        profilePhoto: data.profilePhoto ?? null,
        address: data.address ?? null,
        accountStatus: ASTROLOGER_ACCOUNT_STATUS.APPROVED,
        isActive: true,
        isVerified: false,
      },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        profilePhoto: true,
        address: true,
        bio: true,
        specialization: true,
        experience: true,
        category: true,
        appointmentFee: true,
        chatMessageFee: true,
        rating: true,
        totalConsultations: true,
        isActive: true,
        isOnline: true,
        isVerified: true,
        commissionRate: true,
        languages: true,
        gender: true,
        country: true,
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
    const trimmed = identifier.trim();
    if (!trimmed) {
      throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
    }
    const isEmail = trimmed.includes('@');
    // Find astrologer by phone or email (exclude soft-deleted); email match is case-insensitive
    let astrologer = await prisma.astrologer.findFirst({
      where: {
        isDeleted: false,
        OR: isEmail
          ? [{ email: { equals: trimmed, mode: 'insensitive' } }]
          : [{ phone: trimmed }, { phone: trimmed.replace(/\D/g, '') }],
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
        accountStatus: true,
        commissionRate: true,
        languages: true,
        gender: true,
        country: true,
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

    // Check account status
    if (astrologer.accountStatus === ASTROLOGER_ACCOUNT_STATUS.PENDING) {
      throw new AppError(
        'Your registration is pending approval. Please wait for admin approval.',
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.FORBIDDEN
      );
    }

    if (astrologer.accountStatus === ASTROLOGER_ACCOUNT_STATUS.REJECTED) {
      throw new AppError(
        'Your registration has been rejected. Please contact support for more information.',
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.FORBIDDEN
      );
    }

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
        gender: astrologer.gender,
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
   * Update astrologer details (excludes isOnline - use updateOnlineStatus)
   */
  async update(
    id: string,
    data: {
      email?: string | null;
      name?: string;
      phone?: string;
      bio?: string | null;
      address?: string | null;
      profilePhoto?: string | null;
      specialization?: string[];
      experience?: number | null;
      commissionRate?: number;
      languages?: string[];
      gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
      category?: AstrologerCategory;
      appointmentFee?: number | null;
      proofOfAstrology?: string | null;
      chatMessageFee?: number | null;
      inhouseAstrologer?: boolean;
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
        category: true,
        appointmentFee: true,
        chatMessageFee: true,
        proofOfAstrology: true,
        rating: true,
        totalConsultations: true,
        isActive: true,
        isOnline: true,
        isVerified: true,
        commissionRate: true,
        inhouseAstrologer: true,
        languages: true,
        gender: true,
        country: true,
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
   * Delete astrologer (soft delete: resource is gone from client perspective)
   */
  async delete(id: string) {
    return await prisma.astrologer.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), isActive: false },
    });
  }

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

    const where: any = {
      accountStatus: ASTROLOGER_ACCOUNT_STATUS.APPROVED,
      isDeleted: false,
    };

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
        where: {
          ...where,
          isDeleted: false,
        },
        skip,
        take: limit,
        select: {
          id: true,
          phone: true,
          email: true,
          name: true,
          profilePhoto: true,
          address: true,
          bio: true,
          specialization: true,
          experience: true,
          category: true,
          appointmentFee: true,
          chatMessageFee: true,
          rating: true,
          totalConsultations: true,
          isActive: true,
          isOnline: true,
          isVerified: true,
          commissionRate: true,
          inhouseAstrologer: true,
          languages: true,
          gender: true,
          country: true,
          proofOfAstrology: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ name: 'asc' }],
      }),
      prisma.astrologer.count({
        where: {
          ...where,
          isDeleted: false,
        },
      }),
    ]);

    const astrologerIds = astrologers.map((a) => a.id);
    const earningsAgg =
      astrologerIds.length > 0
        ? await prisma.astrologerCoinEarning.groupBy({
            by: ['astrologerId'],
            where: { astrologerId: { in: astrologerIds } },
            _sum: { astrologerCoinsEarned: true },
          })
        : [];
    const earningsMap = new Map(
      earningsAgg.map((e) => [e.astrologerId, e._sum.astrologerCoinsEarned ?? 0])
    );

    const astrologersWithBalance = astrologers.map((a) => ({
      ...a,
      totalCoinEarnings: earningsMap.get(a.id) ?? 0,
    }));

    return {
      astrologers: astrologersWithBalance,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

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
    // Get astrologer with password (exclude soft-deleted)
    const astrologer = await prisma.astrologer.findFirst({
      where: { id: astrologerId, isDeleted: false },
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

  /**
   * Register a new astrologer (self-registration request)
   * Creates an account with PENDING status, waiting for admin approval
   */
  async registerRequest(data: {
    name: string;
    phone: string;
    email?: string;
    password: string;
    bio?: string;
    address?: string | null;
    profilePhoto?: string | null;
    specialization: string[];
    experience?: number;
    languages: string[];
    gender?: Gender;
    country?: string | null;
    proofOfAstrology: string; // File URL
  }) {
    // Check if phone already exists (only non-deleted)
    const existingByPhone = await prisma.astrologer.findFirst({
      where: { phone: data.phone, isDeleted: false },
    });

    if (existingByPhone) {
      throw new AppError(
        'An astrologer with this phone number already exists',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Check if email already exists (if provided)
    if (data.email) {
      const existingByEmail = await prisma.astrologer.findFirst({
        where: { email: data.email, isDeleted: false },
      });

      if (existingByEmail) {
        throw new AppError(
          'An astrologer with this email already exists',
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create astrologer with PENDING status
    const astrologer = await prisma.astrologer.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        password: hashedPassword,
        bio: data.bio || null,
        address: data.address ?? null,
        profilePhoto: data.profilePhoto ?? null,
        specialization: data.specialization,
        experience: data.experience || null,
        languages: data.languages,
        gender: (data.gender as Gender) || null,
        country: data.country ?? null,
        proofOfAstrology: data.proofOfAstrology,
        accountStatus: ASTROLOGER_ACCOUNT_STATUS.PENDING,
        registrationRequestedAt: new Date(),
        createdBy: ASTROLOGER_CREATED_BY.SELF_REGISTERED,
        isActive: false,
        category: AstrologerCategory.ORDINARY,
        commissionRate: 0.0,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        accountStatus: true,
        registrationRequestedAt: true,
        createdAt: true,
      },
    });

    return astrologer;
  }

  /**
cle   * Get all pending registration requests with pagination and search
   */
  async getPendingRegistrations(params?: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 10, search } = params || {};
    const skip = (page - 1) * limit;

    const where: any = {
      accountStatus: ASTROLOGER_ACCOUNT_STATUS.PENDING,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.astrologer.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          profilePhoto: true,
          bio: true,
          specialization: true,
          experience: true,
          languages: true,
          gender: true,
          country: true,
          proofOfAstrology: true,
          registrationRequestedAt: true,
          createdAt: true,
        },
        orderBy: {
          registrationRequestedAt: 'desc',
        },
      }),
      prisma.astrologer.count({ where }),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Approve an astrologer registration request
   */
  async approveRegistration(
    astrologerId: string,
    adminId: string,
    data: {
      category: string;
      appointmentFee?: number | null;
      chatMessageFee?: number | null;
      commissionRate?: number;
      inhouseAstrologer?: boolean;
    }
  ) {
    const astrologer = await prisma.astrologer.findFirst({
      where: { id: astrologerId, isDeleted: false },
      select: {
        id: true,
        accountStatus: true,
        email: true,
        phone: true,
        name: true,
      },
    });

    if (!astrologer) {
      throw new AppError('Astrologer not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    if (astrologer.accountStatus !== ASTROLOGER_ACCOUNT_STATUS.PENDING) {
      throw new AppError(
        'This registration request has already been processed',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Update astrologer to APPROVED status
    const updated = await prisma.astrologer.update({
      where: { id: astrologerId },
      data: {
        accountStatus: ASTROLOGER_ACCOUNT_STATUS.APPROVED,
        approvedBy: adminId,
        approvedAt: new Date(),
        isActive: true,
        category: data.category as AstrologerCategory,
        appointmentFee: data.appointmentFee ?? null,
        chatMessageFee: data.chatMessageFee ?? null,
        commissionRate: data.commissionRate ?? 0.0,
        inhouseAstrologer: data.inhouseAstrologer ?? false,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        accountStatus: true,
        category: true,
        appointmentFee: true,
        chatMessageFee: true,
        commissionRate: true,
        approvedBy: true,
        approvedAt: true,
      },
    });

    // Send notifications (email and SMS if Nepali phone)
    try {
      // Send email notification
      if (updated.email) {
        await emailService.sendRegistrationApprovalEmail(
          updated.name,
          updated.email,
          updated.category,
          updated.appointmentFee
        );
      }

      // Send SMS if phone is Nepali
      if (updated.phone && isNepaliPhoneNumber(updated.phone)) {
        const smsMessage = `Namaste ${updated.name}! Your astrologer registration has been approved. You can now log in to Chat Jyotishi and start providing consultations. Category: ${updated.category}.`;
        await smsService.sendNotification(updated.phone, smsMessage);
      }
    } catch (error) {
      // Log error but don't fail the approval process
      console.error('❌ Failed to send approval notifications:', error);
    }

    try {
      const { AdminStatsEmitter } = require('../utils/admin-stats-emitter');
      AdminStatsEmitter.emitSidebarInvalidate();
    } catch (e) {
      console.error('Failed to emit sidebar invalidate:', e);
    }

    return updated;
  }

  /**
   * Reject an astrologer registration request
   */
  async rejectRegistration(astrologerId: string, adminId: string, rejectionReason: string) {
    const astrologer = await prisma.astrologer.findFirst({
      where: { id: astrologerId, isDeleted: false },
      select: {
        id: true,
        accountStatus: true,
        email: true,
        phone: true,
        name: true,
      },
    });

    if (!astrologer) {
      throw new AppError('Astrologer not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    if (astrologer.accountStatus !== ASTROLOGER_ACCOUNT_STATUS.PENDING) {
      throw new AppError(
        'This registration request has already been processed',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Update astrologer to REJECTED status
    const updated = await prisma.astrologer.update({
      where: { id: astrologerId },
      data: {
        accountStatus: ASTROLOGER_ACCOUNT_STATUS.REJECTED,
        approvedBy: adminId,
        approvedAt: new Date(),
        rejectionReason: rejectionReason,
        isActive: false,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        accountStatus: true,
        rejectionReason: true,
        approvedBy: true,
        approvedAt: true,
      },
    });

    // Send notifications (email and SMS if Nepali phone)
    try {
      // Send email notification
      if (updated.email) {
        await emailService.sendRegistrationRejectionEmail(
          updated.name,
          updated.email,
          rejectionReason
        );
      }

      // Send SMS if phone is Nepali
      if (updated.phone && isNepaliPhoneNumber(updated.phone)) {
        const smsMessage = `Namaste ${updated.name}! Your astrologer registration request has been reviewed. Unfortunately, we are unable to approve it at this time. Please check your email for details or contact support.`;
        await smsService.sendNotification(updated.phone, smsMessage);
      }
    } catch (error) {
      // Log error but don't fail the rejection process
      console.error('❌ Failed to send rejection notifications:', error);
    }

    try {
      const { AdminStatsEmitter } = require('../utils/admin-stats-emitter');
      AdminStatsEmitter.emitSidebarInvalidate();
    } catch (e) {
      console.error('Failed to emit sidebar invalidate:', e);
    }

    return updated;
  }
}

export const astrologerService = new AstrologerService();
