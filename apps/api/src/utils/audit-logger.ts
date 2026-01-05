/**
 * Audit Logger Utility
 * Helper functions for comprehensive audit logging with automatic IP and user agent extraction
 */

import { Request } from 'express';
import { auditService } from '../services/audit.service';
import { AuditAction } from '@jyotish/database';

interface AuditLogParams {
  action: AuditAction;
  resource: string;
  resourceId?: string;
  userId?: string;
  astrologerId?: string;
  adminId?: string;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
  req?: Request;
}

/**
 * Extract IP address from request
 */
function getIpAddress(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Extract user agent from request
 */
function getUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * Log an audit action with automatic IP and user agent extraction
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const { req, ...auditParams } = params;

    await auditService.logAction({
      ...auditParams,
      ipAddress: req ? getIpAddress(req) : undefined,
      userAgent: req ? getUserAgent(req) : undefined,
    });
  } catch (error) {
    // Don't throw errors from audit logging - just log them
    console.error('Audit logging error:', error);
  }
}

/**
 * Log user login
 */
export async function logUserLogin(userId: string, req: Request, details?: Record<string, any>): Promise<void> {
  await logAudit({
    action: 'USER_LOGIN',
    resource: 'User',
    resourceId: userId,
    userId,
    details,
    req,
  });
}

/**
 * Log user logout
 */
export async function logUserLogout(userId: string, req: Request): Promise<void> {
  await logAudit({
    action: 'USER_LOGOUT',
    resource: 'User',
    resourceId: userId,
    userId,
    req,
  });
}

/**
 * Log user registration
 */
export async function logUserRegister(userId: string, req: Request, details?: Record<string, any>): Promise<void> {
  await logAudit({
    action: 'USER_REGISTER',
    resource: 'User',
    resourceId: userId,
    userId,
    details,
    req,
  });
}

/**
 * Log astrologer login
 */
export async function logAstrologerLogin(astrologerId: string, req: Request, details?: Record<string, any>): Promise<void> {
  await logAudit({
    action: 'ASTROLOGER_LOGIN',
    resource: 'Astrologer',
    resourceId: astrologerId,
    astrologerId,
    details,
    req,
  });
}

/**
 * Log astrologer logout
 */
export async function logAstrologerLogout(astrologerId: string, req: Request): Promise<void> {
  await logAudit({
    action: 'ASTROLOGER_LOGOUT',
    resource: 'Astrologer',
    resourceId: astrologerId,
    astrologerId,
    req,
  });
}

/**
 * Log chat start
 */
export async function logChatStart(chatId: string, userId: string, astrologerId: string, req?: Request): Promise<void> {
  await logAudit({
    action: 'CHAT_START',
    resource: 'Chat',
    resourceId: chatId,
    userId,
    astrologerId,
    details: { chatId, userId, astrologerId },
    req,
  });
}

/**
 * Log instant chat request creation
 */
export async function logInstantChatRequestCreate(requestId: string, userId: string, req?: Request, details?: Record<string, any>): Promise<void> {
  await logAudit({
    action: 'INSTANT_CHAT_REQUEST_CREATE',
    resource: 'InstantChatRequest',
    resourceId: requestId,
    userId,
    details,
    req,
  });
}

/**
 * Log instant chat request acceptance
 */
export async function logInstantChatRequestAccept(requestId: string, userId: string, astrologerId: string, req?: Request): Promise<void> {
  await logAudit({
    action: 'INSTANT_CHAT_REQUEST_ACCEPT',
    resource: 'InstantChatRequest',
    resourceId: requestId,
    userId,
    astrologerId,
    details: { acceptedBy: astrologerId },
    req,
  });
}

/**
 * Log instant chat request expiration
 */
export async function logInstantChatRequestExpire(requestId: string, userId: string): Promise<void> {
  await logAudit({
    action: 'INSTANT_CHAT_REQUEST_EXPIRE',
    resource: 'InstantChatRequest',
    resourceId: requestId,
    userId,
    details: { reason: 'No astrologer accepted in time' },
  });
}

/**
 * Log instant chat request cancellation
 */
export async function logInstantChatRequestCancel(requestId: string, userId: string, req?: Request): Promise<void> {
  await logAudit({
    action: 'INSTANT_CHAT_REQUEST_CANCEL',
    resource: 'InstantChatRequest',
    resourceId: requestId,
    userId,
    details: { cancelledBy: 'client' },
    req,
  });
}

/**
 * Log consultation request creation
 */
export async function logConsultationRequestCreate(requestId: string, userId: string, req?: Request, details?: Record<string, any>): Promise<void> {
  await logAudit({
    action: 'CONSULTATION_REQUEST_CREATE',
    resource: 'ConsultationRequest',
    resourceId: requestId,
    userId,
    details,
    req,
  });
}

/**
 * Log consultation request acceptance
 */
export async function logConsultationRequestAccept(requestId: string, userId: string, astrologerId: string, req?: Request): Promise<void> {
  await logAudit({
    action: 'CONSULTATION_REQUEST_ACCEPT',
    resource: 'ConsultationRequest',
    resourceId: requestId,
    userId,
    astrologerId,
    details: { acceptedBy: astrologerId },
    req,
  });
}

/**
 * Log consultation request expiration
 */
export async function logConsultationRequestExpire(requestId: string, userId: string): Promise<void> {
  await logAudit({
    action: 'CONSULTATION_REQUEST_EXPIRE',
    resource: 'ConsultationRequest',
    resourceId: requestId,
    userId,
    details: { reason: 'No astrologer accepted in time' },
  });
}

/**
 * Log consultation request cancellation
 */
export async function logConsultationRequestCancel(requestId: string, userId: string, req?: Request): Promise<void> {
  await logAudit({
    action: 'CONSULTATION_REQUEST_CANCEL',
    resource: 'ConsultationRequest',
    resourceId: requestId,
    userId,
    details: { cancelledBy: 'client' },
    req,
  });
}

/**
 * Log broadcast message creation
 */
export async function logBroadcastMessageCreate(messageId: string, userId: string, req?: Request, details?: Record<string, any>): Promise<void> {
  await logAudit({
    action: 'BROADCAST_MESSAGE_CREATE',
    resource: 'BroadcastMessage',
    resourceId: messageId,
    userId,
    details,
    req,
  });
}

/**
 * Log broadcast message acceptance
 */
export async function logBroadcastMessageAccept(messageId: string, userId: string, astrologerId: string, req?: Request): Promise<void> {
  await logAudit({
    action: 'BROADCAST_MESSAGE_ACCEPT',
    resource: 'BroadcastMessage',
    resourceId: messageId,
    userId,
    astrologerId,
    details: { acceptedBy: astrologerId },
    req,
  });
}

/**
 * Log broadcast message expiration
 */
export async function logBroadcastMessageExpire(messageId: string, userId: string): Promise<void> {
  await logAudit({
    action: 'BROADCAST_MESSAGE_EXPIRE',
    resource: 'BroadcastMessage',
    resourceId: messageId,
    userId,
    details: { reason: 'No astrologer accepted in time' },
  });
}

