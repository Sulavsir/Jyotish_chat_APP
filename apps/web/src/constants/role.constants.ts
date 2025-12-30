/**
 * Role Constants
 */

import { UserRole } from '@/types';

export const USER_ROLES = {
  CLIENT: UserRole.CLIENT,
  ASTROLOGER: UserRole.ASTROLOGER,
  ADMIN: UserRole.ADMIN,
} as const;

/**
 * Role display names
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.CLIENT]: 'Client',
  [USER_ROLES.ASTROLOGER]: 'Jyotish (Astrologer)',
  [USER_ROLES.ADMIN]: 'Admin',
};

/**
 * Default dashboard routes for each role
 */
export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  [USER_ROLES.CLIENT]: '/chat', // Clients go directly to chat with "Everyone Jyotish"
  [USER_ROLES.ASTROLOGER]: '/jyotish/dashboard',
  [USER_ROLES.ADMIN]: '/admin/dashboard',
};

/**
 * Check if user has a specific role
 */
export function hasRole(userRole: string | undefined, requiredRole: UserRole): boolean {
  return userRole === requiredRole;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(userRole: string | undefined, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole as UserRole);
}

/**
 * Get dashboard route based on role
 */
export function getDashboardRoute(role: string | undefined): string {
  if (!role) return '/dashboard';
  return ROLE_DASHBOARDS[role as UserRole] || '/dashboard';
}
