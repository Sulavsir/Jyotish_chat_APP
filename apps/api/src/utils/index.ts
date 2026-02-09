/**
 * Backend Utility Functions
 */

import { Response } from 'express';
import { ApiResponse } from '../types';
import { HTTP_STATUS } from '../constants';

// Re-export constants
export { HTTP_STATUS, ERROR_CODES } from '../constants';

// Re-export error classes
export { AppError } from '../middleware/error-handler';

// Re-export encryption utilities
export * from './encryption';

// Re-export async handler
export * from './async-handler';

// Delete utilities (soft-delete flows)
export * from './delete.utils';

// Re-export user utilities
export * from './user-utils';

// Re-export cookie utilities
export * from './cookie-utils';

// Audit Logging
export * from './audit-logger';

// Admin Monitoring
export * from './admin-monitor';

/**
 * Send success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = HTTP_STATUS.OK
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  return res.status(statusCode).json(response);
}

/**
 * Send error response
 */
export function sendError(
  res: Response,
  message: string,
  statusCode: number = HTTP_STATUS.BAD_REQUEST,
  code?: string,
  details?: any
): Response {
  const response: ApiResponse = {
    success: false,
    error: {
      message,
      code,
      details: process.env.NODE_ENV === 'development' ? details : undefined,
    },
  };
  return res.status(statusCode).json(response);
}

/**
 * Send paginated response
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number
): Response {
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
  return res.status(HTTP_STATUS.OK).json(response);
}

/**
 * Calculate consultation amount
 */
export function calculateConsultationAmount(
  duration: number,
  type: 'CHAT' | 'VOICE' | 'VIDEO'
): number {
  const baseRates = {
    CHAT: 20,
    VOICE: 30,
    VIDEO: 50,
  };

  return (duration / 15) * baseRates[type];
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sleep/delay function
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
