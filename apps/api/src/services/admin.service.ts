import { prisma } from '@jyotish/database';
import { UserRole } from '@jyotish/shared';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AUTH_CONFIG } from '../constants';

export class AdminService {
  /**
   * Admin login
   */
  async login(email: string, password: string) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new Error('Invalid credentials');
    }

    if (!admin.isActive) {
      throw new Error('Admin account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate admin tokens
    const accessToken = this.generateAccessToken(admin.id, admin.email);
    const refreshToken = this.generateRefreshToken(admin.id, admin.email);

    return {
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Get admin by ID
   */
  async getAdminById(id: string) {
    const admin = await prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      throw new Error('Admin not found');
    }

    return admin;
  }

  /**
   * Update admin password
   */
  async updatePassword(adminId: string, currentPassword: string, newPassword: string) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new Error('Admin not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, AUTH_CONFIG.SALT_ROUNDS);

    await prisma.admin.update({
      where: { id: adminId },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  /**
   * Generate access token for admin
   */
  generateAccessToken(adminId: string, email: string): string {
    const payload = {
      id: adminId,
      email,
      role: UserRole.ADMIN,
      type: 'access', // Fixed: lowercase to match auth middleware
    };

    return jwt.sign(payload, AUTH_CONFIG.JWT_SECRET!, {
      expiresIn: `${AUTH_CONFIG.ACCESS_TOKEN_EXPIRES_IN_MINUTES}m`,
      algorithm: AUTH_CONFIG.JWT_ALGORITHM,
    });
  }

  /**
   * Generate refresh token for admin
   */
  generateRefreshToken(adminId: string, email: string): string {
    const payload = {
      id: adminId,
      email,
      role: UserRole.ADMIN,
      type: 'refresh', // Fixed: lowercase to match auth middleware
    };

    return jwt.sign(payload, AUTH_CONFIG.JWT_SECRET!, {
      expiresIn: `${AUTH_CONFIG.REFRESH_TOKEN_EXPIRES_IN_DAYS}d`,
      algorithm: AUTH_CONFIG.JWT_ALGORITHM,
    });
  }

  /**
   * Verify admin access token
   */
  verifyAccessToken(token: string) {
    try {
      const decoded = jwt.verify(token, AUTH_CONFIG.JWT_SECRET!, {
        algorithms: [AUTH_CONFIG.JWT_ALGORITHM],
      }) as {
        id: string;
        email: string;
        role: string;
        type: string;
      };

      if (decoded.role !== UserRole.ADMIN || decoded.type !== 'access') {
        throw new Error('Invalid token');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Verify admin refresh token
   */
  verifyRefreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, AUTH_CONFIG.JWT_SECRET!, {
        algorithms: [AUTH_CONFIG.JWT_ALGORITHM],
      }) as {
        id: string;
        email: string;
        role: string;
        type: string;
      };

      if (decoded.role !== UserRole.ADMIN || decoded.type !== 'refresh') {
        throw new Error('Invalid token');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }
}

export const adminService = new AdminService();
