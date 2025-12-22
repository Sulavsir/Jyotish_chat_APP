/**
 * Backend Type Definitions
 */

import { Request } from 'express';
import type { UserRole } from '@jyotish/shared';

// Re-export shared types
export * from '@jyotish/shared';

// Express Request with authenticated user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Pagination Query
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

// Socket User Data
export interface SocketUser {
  id: string;
  email: string;
  role: string;
}

// Service Response
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

