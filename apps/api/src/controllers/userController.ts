/**
 * User Controller - Handle user-related requests
 * Controllers should be thin - only handle request validation, input handling, and responses
 * All business logic is delegated to services
 * Errors are handled by global error handler
 */

import { Response, NextFunction } from 'express';
import { prisma } from '@jyotish/database';
import { birthDetailsSchema } from '../validators';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { getZodiacSign, UserRole } from '@jyotish/shared';
import { AppError } from '../middleware/error-handler';
import * as userServiceNew from '../services/userService';

function isClientProfileCompleteForFlag(user: {
  name?: string | null;
  dateOfBirth?: Date | string | null;
  timeOfBirth?: string | null;
  placeOfBirth?: string | null;
  gender?: unknown | null;
}): boolean {
  return (
    !!user.name &&
    user.name.trim().length > 0 &&
    !!user.dateOfBirth &&
    !!user.timeOfBirth &&
    user.timeOfBirth.trim().length > 0 &&
    !!user.placeOfBirth &&
    user.placeOfBirth.trim().length > 0 &&
    !!user.gender
  );
}

/**
 * Get current user profile
 * GET /api/v1/users/me
 */
export async function getCurrentUser(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Check if user is an astrologer or client
  if (userRole === UserRole.ASTROLOGER) {
    // Get astrologer profile
    const astrologer = await prisma.astrologer.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        profilePhoto: true,
        bio: true,
        specialization: true,
        experience: true,
        rating: true,
        totalConsultations: true,
        category: true,
        appointmentFee: true,
        isActive: true,
        isOnline: true,
        isVerified: true,
        languages: true,
        gender: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!astrologer) {
      throw new AppError('Astrologer not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND);
    }

    // Format response
    const { phone, password, category, appointmentFee, ...astrologerWithoutSensitiveData } =
      astrologer;
    const formattedAstrologer = {
      ...astrologerWithoutSensitiveData,
      phoneNumber: phone,
      role: UserRole.ASTROLOGER,
      zodiacSign: null,
      hasPassword: !!password,
      profileCompleted: true, 
      astrologer: {
        id: astrologer.id,
        category,
        appointmentFee,
      },
    };

    return sendSuccess(res, formattedAstrologer);
  } else {
    // Get client profile
    const user = await prisma.user.findUnique({
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
        gender: true,
        latitude: true,
        longitude: true,
        password: true,
        profileCompleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND);
    }

    // Format response
    const { phone, password, ...userWithoutSensitiveData } = user;
    const formattedUser = {
      ...userWithoutSensitiveData,
      phoneNumber: phone,
      hasPassword: !!password,
    };

    return sendSuccess(res, formattedUser);
  }
}

/**
 * Update user profile
 * PATCH /api/v1/users/me
 */
export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  const { name, email, phone, profilePhoto, bio, specialization, experience, languages, gender, zodiacSign } =
    req.body;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Check if user is an astrologer or client
  if (userRole === UserRole.ASTROLOGER) {
    // Update astrologer profile
    const astrologer = await prisma.astrologer.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email: email || null }),
        ...(phone && { phone }),
        ...(profilePhoto && { profilePhoto }),
        ...(bio !== undefined && { bio }),
        ...(specialization && { specialization }),
        ...(experience !== undefined && { experience }),
        ...(languages && { languages }),
        ...(gender && { gender }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        profilePhoto: true,
        bio: true,
        specialization: true,
        experience: true,
        rating: true,
        totalConsultations: true,
        isActive: true,
        isOnline: true,
        isVerified: true,
        languages: true,
        gender: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Format response
    const { phone: astrologerPhone, password, ...astrologerWithoutSensitiveData } = astrologer;
    const formattedAstrologer = {
      ...astrologerWithoutSensitiveData,
      phoneNumber: astrologerPhone,
      role: UserRole.ASTROLOGER,
      // zodiacSign is client-only; keep it present for a consistent `/users/me` shape
      zodiacSign: null,
      hasPassword: !!password,
    };

    return sendSuccess(res, formattedAstrologer);
  } else {
    // Update client profile
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email: email || null }),
        ...(phone && { phone }),
        ...(profilePhoto && { profilePhoto }),
        ...(gender && { gender }),
        ...(zodiacSign !== undefined ? { zodiacSign: zodiacSign || null } : {}),
      },
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
        gender: true,
        latitude: true,
        longitude: true,
        password: true,
        profileCompleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Keep profileCompleted in sync with actual required fields (same rule as frontend)
    const shouldBeCompleted = isClientProfileCompleteForFlag(user);
    const finalUser =
      user.profileCompleted === shouldBeCompleted
        ? user
        : await prisma.user.update({
            where: { id: userId },
            data: { profileCompleted: shouldBeCompleted },
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
              gender: true,
              latitude: true,
              longitude: true,
              password: true,
              profileCompleted: true,
              createdAt: true,
              updatedAt: true,
            },
          });

    // Format response
    const { phone: userPhone, password, ...userWithoutSensitiveData } = finalUser;
    const formattedUser = {
      ...userWithoutSensitiveData,
      phoneNumber: userPhone,
      hasPassword: !!password,
    };

    return sendSuccess(res, formattedUser);
  }
}

/**
 * Update birth details
 * PATCH /api/v1/users/me/birth-details
 * Note: This is only for clients, not astrologers
 */
export async function updateBirthDetails(req: AuthRequest, res: Response, next: NextFunction) {
  const userRole = req.user!.role;
  const debug = process.env.NODE_ENV !== 'production';

  // Birth details are only for clients
  if (userRole === UserRole.ASTROLOGER) {
    throw new AppError(
      'Astrologers cannot update birth details',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  if (debug) {
    console.log('[users/me/birth-details] incoming body:', req.body);
  }

  const validatedData = birthDetailsSchema.parse(req.body);
  const dob = new Date(validatedData.dateOfBirth);
  // Preserve existing zodiacSign unless the client explicitly provides it.
  // This prevents clients (e.g. Flutter) that omit zodiacSign from unintentionally overwriting
  // an already-selected sign with an auto-calculated one.
  const existing = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { name: true, zodiacSign: true, gender: true },
  });

  if (!existing) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND);
  }

  if (debug) {
    console.log('[users/me/birth-details] validated:', {
      dateOfBirth: validatedData.dateOfBirth,
      timeOfBirth: validatedData.timeOfBirth,
      placeOfBirth: validatedData.placeOfBirth,
      zodiacSign: validatedData.zodiacSign,
      gender: validatedData.gender,
    });
    console.log('[users/me/birth-details] existing:', {
      zodiacSign: existing.zodiacSign,
      gender: existing.gender,
      name: existing.name,
    });
  }

  const resolvedZodiacSign =
    validatedData.zodiacSign !== undefined && validatedData.zodiacSign !== null
      ? validatedData.zodiacSign
      : existing.zodiacSign ?? getZodiacSign(dob);

  const genderForCompletion =
    validatedData.gender !== undefined ? validatedData.gender : existing.gender;
  const computedProfileCompleted = isClientProfileCompleteForFlag({
    name: existing.name,
    dateOfBirth: dob,
    timeOfBirth: validatedData.timeOfBirth,
    placeOfBirth: validatedData.placeOfBirth,
    gender: genderForCompletion,
  });

  if (debug) {
    console.log('[users/me/birth-details] resolved:', {
      resolvedZodiacSign,
      computedProfileCompleted,
    });
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      dateOfBirth: dob,
      timeOfBirth: validatedData.timeOfBirth,
      placeOfBirth: validatedData.placeOfBirth,
      latitude: validatedData.latitude,
      longitude: validatedData.longitude,
      currentAddress: validatedData.currentAddress,
      permanentAddress: validatedData.permanentAddress,
      zodiacSign: resolvedZodiacSign,
      ...(validatedData.gender !== undefined ? { gender: validatedData.gender } : {}),
      profileCompleted: computedProfileCompleted,
    },
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
      gender: true,
      latitude: true,
      longitude: true,
      password: true,
      profileCompleted: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Format response to match frontend expectations
  const { phone, password, ...userWithoutSensitiveData } = user;
  const formattedUser = {
    ...userWithoutSensitiveData,
    phoneNumber: phone,
    hasPassword: !!password,
  };

  if (debug) {
    console.log('[users/me/birth-details] response:', {
      id: formattedUser.id,
      zodiacSign: formattedUser.zodiacSign,
      gender: formattedUser.gender,
      profileCompleted: formattedUser.profileCompleted,
    });
  }

  return sendSuccess(res, formattedUser);
}

/**
 * Upload profile photo
 * POST /api/v1/users/upload-photo
 */
export async function uploadPhoto(req: AuthRequest, res: Response, next: NextFunction) {
  // Multer may attach the upload either to `req.file` (single) or `req.files` (fields)
  const file =
    // @ts-ignore - multer adds 'file' property
    req.file ||
    // @ts-ignore - multer adds 'files' property
    (req.files?.['photo']?.[0] ||
      // @ts-ignore
      req.files?.['file']?.[0] ||
      // @ts-ignore
      req.files?.['image']?.[0]);
  const debug = process.env.NODE_ENV !== 'production';

  if (debug) {
    console.log('[users/upload-photo] file mimetype:', (file as any)?.mimetype);
  }

  if (debug) {
    console.log('[users/upload-photo] file:', file
      ? {
          originalname: (file as any).originalname,
          mimetype: (file as any).mimetype,
          size: (file as any).size,
          filename: (file as any).filename,
        }
      : null);
  }

  if (!file) {
    throw new AppError('No file uploaded', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }

  const userRole = req.user!.role;
  const userId = req.user!.id;

  // Get current photo to delete old one
  let currentProfilePhoto: string | null = null;

  if (userRole === UserRole.ASTROLOGER) {
    const astrologer = await prisma.astrologer.findUnique({
      where: { id: userId },
      select: { profilePhoto: true },
    });
    currentProfilePhoto = astrologer?.profilePhoto || null;
  } else {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhoto: true },
    });
    currentProfilePhoto = user?.profilePhoto || null;
  }

  // Delete old profile photo if exists
  if (currentProfilePhoto) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const oldPhotoPath = path.join(process.cwd(), currentProfilePhoto);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    } catch (error) {
      // Continue even if old file deletion fails
      console.error('Error deleting old profile photo:', error);
    }
  }

  // Generate URL for the uploaded file
  const fileUrl = `/uploads/profiles/${file.filename}`;

  // Update profile photo in the correct table based on role
  let updatedUser: any;

  if (userRole === UserRole.ASTROLOGER) {
    updatedUser = await prisma.astrologer.update({
      where: { id: userId },
      data: { profilePhoto: fileUrl },
      select: {
        id: true,
        profilePhoto: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Format response for astrologer
    const formattedUser = {
      ...updatedUser,
      role: UserRole.ASTROLOGER,
      phoneNumber: updatedUser.phone,
      // zodiacSign is client-only; keep it present for a consistent `/users/me` shape
      zodiacSign: null,
    };

    return sendSuccess(res, formattedUser);
  } else {
    updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: fileUrl },
      select: {
        id: true,
        profilePhoto: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        dateOfBirth: true,
        timeOfBirth: true,
        placeOfBirth: true,
        currentAddress: true,
        permanentAddress: true,
        zodiacSign: true,
        gender: true,
        latitude: true,
        longitude: true,
        password: true,
        profileCompleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Format response to match frontend expectations
    const { phone, password, ...userWithoutSensitiveData } = updatedUser;
    const formattedUser = {
      ...userWithoutSensitiveData,
      phoneNumber: phone,
      hasPassword: !!password,
    };

    return sendSuccess(res, formattedUser);
  }
}

/**
 * Remove profile photo
 * DELETE /api/v1/users/remove-photo
 */
export async function removePhoto(req: AuthRequest, res: Response, next: NextFunction) {
  const userRole = req.user!.role;
  const userId = req.user!.id;

  // Get current photo based on role
  let currentProfilePhoto: string | null = null;

  if (userRole === UserRole.ASTROLOGER) {
    const astrologer = await prisma.astrologer.findUnique({
      where: { id: userId },
      select: { profilePhoto: true },
    });
    currentProfilePhoto = astrologer?.profilePhoto || null;
  } else {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhoto: true },
    });
    currentProfilePhoto = user?.profilePhoto || null;
  }

  if (!currentProfilePhoto) {
    throw new AppError(
      'No profile photo to remove',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Delete the profile photo file
  try {
    const fs = await import('fs');
    const path = await import('path');
    const photoPath = path.join(process.cwd(), currentProfilePhoto);
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }
  } catch (error) {
    console.error('Error deleting profile photo file:', error);
    // Continue even if file deletion fails
  }

  // Update profile photo to null in the correct table based on role
  let updatedUser: any;

  if (userRole === UserRole.ASTROLOGER) {
    updatedUser = await prisma.astrologer.update({
      where: { id: userId },
      data: { profilePhoto: null },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        profilePhoto: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Format response for astrologer
    const formattedUser = {
      ...updatedUser,
      role: UserRole.ASTROLOGER,
      phoneNumber: updatedUser.phone,
    };

    return sendSuccess(res, formattedUser);
  } else {
    updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: null },
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
        gender: true,
        latitude: true,
        longitude: true,
        password: true,
        profileCompleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Format response to match frontend expectations
    const { phone, password, ...userWithoutSensitiveData } = updatedUser;
    const formattedUser = {
      ...userWithoutSensitiveData,
      phoneNumber: phone,
      hasPassword: !!password,
    };

    return sendSuccess(res, formattedUser);
  }
}

/**
 * Get users to chat with (astrologers for clients, clients for astrologers)
 * GET /api/v1/users/chatable
 */
export async function getChatableUsers(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const users = await userServiceNew.getChatableUsers(userId, userRole);

  return sendSuccess(res, users);
}

/**
 * Get client details by ID (for astrologers to view client profile)
 * GET /api/v1/users/:id/details
 */
export async function getClientDetails(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    // Only astrologers can view client details
    if (currentUser.role !== UserRole.ASTROLOGER) {
      return sendError(res, 'Only astrologers can view client details', HTTP_STATUS.FORBIDDEN);
    }

    // Get client user details
    const client = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        profilePhoto: true,
        dateOfBirth: true,
        timeOfBirth: true,
        placeOfBirth: true,
        currentAddress: true,
        permanentAddress: true,
        zodiacSign: true,
        gender: true,
        profileCompleted: true,
        createdAt: true,
      },
    });

    if (!client) {
      throw new AppError('Client not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    // Verify it's a client, not an astrologer
    if (client.role !== UserRole.CLIENT) {
      return sendError(res, 'User is not a client', HTTP_STATUS.BAD_REQUEST);
    }

    return sendSuccess(res, { client });
  } catch (error) {
    next(error);
  }
}
