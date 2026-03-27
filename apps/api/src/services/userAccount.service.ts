/**
 * Client account lifecycle (soft delete, etc.)
 */

import { prisma } from '@jyotish/database';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import { sessionService } from './session.service';

export async function softDeleteClientAccount(userId: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { id: userId, isDeleted: false },
    select: { id: true },
  });

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND);
  }

  await sessionService.revokeAllUserSessions(userId);

  await prisma.user.update({
    where: { id: userId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      isActive: false,
      isOnline: false,
    },
  });
}
