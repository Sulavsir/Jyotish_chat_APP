import { Response, NextFunction } from 'express';
import { prisma } from '@jyotish/database';
import { UserRole } from '@jyotish/shared';
import { AppError } from './error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import type { AuthRequest } from './auth';

/**
 * After authenticate: for CLIENT JWTs, reject if the User row is soft-deleted.
 * Astrologer routes on this router skip the DB check (JWT id refers to Astrologer, not User).
 */
export async function ensureActiveUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (req.user?.role !== UserRole.CLIENT) {
      next();
      return;
    }

    const row = await prisma.user.findFirst({
      where: { id: req.user.id, isDeleted: false },
      select: { id: true },
    });

    if (!row) {
      next(
        new AppError(
          'Account no longer available',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.UNAUTHORIZED
        )
      );
      return;
    }

    next();
  } catch (e) {
    next(e);
  }
}
