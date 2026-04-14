/**
 * Common Types - Shared types across the backend
 */

import { Request } from 'express';
import type { AdminRole, UserRole } from '@jyotish/shared';

/**
 * Express Request with authenticated user
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    phone?: string;
    role: UserRole;
    adminRole?: AdminRole;
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

/**
 * Lightweight user summary used in relation includes (e.g. consultation.client)
 */
export interface UserSummary {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  profilePhoto: string | null;
}

/**
 * Lightweight astrologer summary used in relation includes
 */
export interface AstrologerSummary {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  profilePhoto: string | null;
}

/**
 * Lightweight admin summary used in relation includes
 */
export interface AdminSummary {
  id: string;
  name: string | null;
  email: string | null;
}

/**
 * Payment summary used in relation includes
 */
export interface PaymentSummary {
  id: string;
  amount: number;
  status: string;
  transactionId: string | null;
}

