/**
 * Restricts routes to full platform admins (excludes USER_SUPPORT).
 * Use for payment / payouts: add user balance, coin-transactions, earnings routes, astrologer earnings.
 */

import { NextFunction, Response } from 'express';
import { AdminRole } from '@jyotish/shared';
import { AppError } from './error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';
import type { AuthRequest } from '../types';

export function requireFullAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const scope = req.user?.adminRole ?? AdminRole.FULL;
  if (scope !== AdminRole.FULL) {
    return next(
      new AppError('Insufficient permissions', HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN)
    );
  }
  next();
}
