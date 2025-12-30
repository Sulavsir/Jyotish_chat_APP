/**
 * Common Types - Shared types across the backend
 */

import { Request } from 'express';
import type { UserRole } from '@jyotish/shared';

/**
 * Express Request with authenticated user
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    phone?: string;
    role: UserRole;
  };
}

/**
 * Pagination Query
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

/**
 * Socket User Data
 */
export interface SocketUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Service Response
 */
export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

