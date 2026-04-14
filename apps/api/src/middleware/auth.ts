import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler';
import { AdminRole, UserRole } from '@jyotish/shared';
import { authService } from '../services';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    phone?: string | null;
    email?: string | null;
    role: UserRole;
  };
}

/**
 * Authentication Middleware
 *
 * Validates access token from httpOnly cookie on every request:
 * Step 1: Check if token cookie is present → 401 if not
 * Step 2: Validate token signature → 401 if invalid
 * Step 3: Check expiration → 401 if expired
 * Step 4: Check claims → Continue if valid
 *
 * Server NEVER contacts database for token validation
 * Access token is read from httpOnly cookie (most secure)
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Step 1: Check if access token cookie is present
    const token = req.cookies?.accessToken;

    if (!token) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    // Step 2, 3: Validate token signature and expiration
    // This will throw 401 if token is invalid or expired
    const decoded = authService.verifyAccessToken(token);

    // Step 4: Set user claims in request
    const adminRole =
      decoded.role === UserRole.ADMIN && decoded.adminRole != null
        ? decoded.adminRole
        : decoded.role === UserRole.ADMIN
          ? AdminRole.FULL
          : undefined;

    req.user = {
      id: decoded.id,
      phone: decoded.phone,
      email: decoded.email,
      role: decoded.role,
      ...(adminRole !== undefined ? { adminRole } : {}),
    };

    next();
  } catch (error) {
    // All token validation errors return 401
    if (error instanceof AppError && error.statusCode === 401) {
      next(error);
    } else {
      next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
    }
  }
}

/**
 * Authorization Middleware
 *
 * Checks user roles/permissions after authentication:
 * - Wrong audience/role/scope → 403 Forbidden
 */
export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    // Check if user has required role
    if (roles.length && !roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
    }

    next();
  };
}
