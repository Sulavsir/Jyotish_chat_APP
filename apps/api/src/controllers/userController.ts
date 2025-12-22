/**
 * User Controller - Handle user-related requests
 */

import { Response, NextFunction } from 'express';
import { prisma } from '@jyotish/database';
import { birthDetailsSchema } from '../validators';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { getZodiacSign } from '@jyotish/shared';

/**
 * Get current user profile
 * GET /api/v1/users/me
 */
export async function getCurrentUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        image: true,
        dateOfBirth: true,
        timeOfBirth: true,
        placeOfBirth: true,
        zodiacSign: true,
        latitude: true,
        longitude: true,
        createdAt: true,
      },
    });

    if (!user) {
      return sendError(res, 'User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND);
    }

    return sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
}

/**
 * Update user profile
 * PATCH /api/v1/users/me
 */
export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, phone, image } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(image && { image }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        image: true,
        createdAt: true,
      },
    });

    return sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
}

/**
 * Update birth details
 * PATCH /api/v1/users/me/birth-details
 */
export async function updateBirthDetails(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const validatedData = birthDetailsSchema.parse(req.body);
    const dob = new Date(validatedData.dateOfBirth);
    const zodiacSign = getZodiacSign(dob);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        dateOfBirth: dob,
        timeOfBirth: validatedData.timeOfBirth,
        placeOfBirth: validatedData.placeOfBirth,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        zodiacSign,
      },
      select: {
        id: true,
        dateOfBirth: true,
        timeOfBirth: true,
        placeOfBirth: true,
        latitude: true,
        longitude: true,
        zodiacSign: true,
      },
    });

    return sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
}

