/**
 * Audit Logging Middleware
 * Automatically logs all actions for admin monitoring
 */

import { Request, Response, NextFunction } from 'express';
import { AuditAction } from '@jyotish/database';
import { auditService } from '../services/audit.service';
import type { AuthRequest } from '../types';

/**
 * Create audit log middleware
 * @param action - The audit action type
 * @param resource - The resource being acted upon
 * @param getResourceId - Function to extract resource ID from request
 */
export function auditLogger(
  action: AuditAction,
  resource: string,
  getResourceId?: (req: AuthRequest) => string | undefined
) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Extract resource ID
      const resourceId = getResourceId ? getResourceId(req) : req.params.id;

      // Get IP address
      const ipAddress =
        (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || undefined;

      // Get user agent
      const userAgent = req.headers['user-agent'];

      // Determine who is performing the action
      const userId = req.user?.id;
      const astrologerId = (req as any).astrologer?.id;
      const adminId = (req as any).admin?.id;

      // Log the action asynchronously (don't wait)
      auditService
        .logAction({
          userId,
          astrologerId,
          adminId,
          action,
          resource,
          resourceId,
          details: {
            method: req.method,
            url: req.originalUrl,
            body: sanitizeBody(req.body),
            params: req.params,
            query: req.query,
          },
          ipAddress,
          userAgent,
        })
        .catch((error) => {
          console.error('Failed to log audit action:', error);
          // Don't fail the request if audit logging fails
        });

      next();
    } catch (error) {
      // Don't fail the request if audit logging fails
      console.error('Audit logger middleware error:', error);
      next();
    }
  };
}

/**
 * Sanitize request body to remove sensitive data
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };

  // Remove sensitive fields
  const sensitiveFields = ['password', 'confirmPassword', 'token', 'refreshToken', 'accessToken'];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Log user login
 */
export const logUserLogin = auditLogger(AuditAction.USER_LOGIN, 'User', (req) => req.user?.id);

/**
 * Log user logout
 */
export const logUserLogout = auditLogger(AuditAction.USER_LOGOUT, 'User', (req) => req.user?.id);

/**
 * Log user registration
 */
export const logUserRegister = auditLogger(
  AuditAction.USER_REGISTER,
  'User',
  (req) => req.body.phoneNumber
);

/**
 * Log astrologer login
 */
export const logAstrologerLogin = auditLogger(
  AuditAction.ASTROLOGER_LOGIN,
  'Astrologer',
  (req) => (req as any).astrologer?.id
);

/**
 * Log astrologer logout
 */
export const logAstrologerLogout = auditLogger(
  AuditAction.ASTROLOGER_LOGOUT,
  'Astrologer',
  (req) => (req as any).astrologer?.id
);

/**
 * Log message send
 */
export const logMessageSend = auditLogger(
  AuditAction.MESSAGE_SEND,
  'Message',
  (req) => req.body.chatId
);

/**
 * Log chat start
 */
export const logChatStart = auditLogger(
  AuditAction.CHAT_START,
  'Chat',
  (req) => req.body.participantId
);

/**
 * Log chat end
 */
export const logChatEnd = auditLogger(AuditAction.CHAT_END, 'Chat', (req) => req.params.id);

