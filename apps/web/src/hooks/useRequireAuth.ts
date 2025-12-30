/**
 * Custom hook to require authentication
 * Automatically redirects to login if user is not authenticated
 * Supports role-based access control
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { ROUTES, USER_ROLES } from '@/constants';

interface UseRequireAuthOptions {
  redirectTo?: string;
  requireProfileCompleted?: boolean;
  requiredRole?: string; // Require specific role
  allowedRoles?: string[]; // Allow multiple roles
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { redirectTo, requireProfileCompleted = false, requiredRole, allowedRoles } = options;

  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Only run checks if we're not loading
    if (!isAuthenticated) {
      // Determine redirect based on required role
      const loginRoute =
        requiredRole === USER_ROLES.ASTROLOGER ? ROUTES.JYOTISH_LOGIN : redirectTo || ROUTES.LOGIN;

      router.push(loginRoute);
      return;
    }

    // Wait for user to be loaded before checking role
    if (!user) {
      return;
    }

    // Check role-based access
    // If specific role is required and user has wrong role, redirect to their correct dashboard
    if (requiredRole && user.role !== requiredRole) {
      console.warn(`Access denied: Required role ${requiredRole}, but user has role ${user.role}`);
      
      // Redirect directly to their appropriate dashboard instead of showing unauthorized page
      const correctDashboard =
        user.role === USER_ROLES.ASTROLOGER ? ROUTES.JYOTISH_DASHBOARD : ROUTES.DASHBOARD;
      
      router.push(correctDashboard);
      return;
    }

    // If multiple roles are allowed
    if (allowedRoles && user.role && !allowedRoles.includes(user.role)) {
      console.warn(`Access denied: User role ${user.role} not in allowed roles`, allowedRoles);
      
      // Redirect directly to their appropriate dashboard
      const correctDashboard =
        user.role === USER_ROLES.ASTROLOGER ? ROUTES.JYOTISH_DASHBOARD : ROUTES.DASHBOARD;
      
      router.push(correctDashboard);
      return;
    }

    // Check profile completion
    if (requireProfileCompleted && !user.profileCompleted) {
      // Redirect to appropriate profile page based on role
      const profileRoute =
        user.role === USER_ROLES.ASTROLOGER ? ROUTES.JYOTISH_PROFILE_SETUP : ROUTES.PROFILE;

      router.push(profileRoute);
    }
  }, [
    isAuthenticated,
    user,
    router,
    redirectTo,
    requireProfileCompleted,
    requiredRole,
    allowedRoles,
  ]);

  // Calculate if we're still checking access
  const isCheckingAccess = 
    !isAuthenticated || // Not authenticated yet
    !user || // User not loaded yet
    (requiredRole && user.role !== requiredRole) || // Role mismatch
    (allowedRoles && user.role && !allowedRoles.includes(user.role)); // Not in allowed roles

  return {
    isAuthenticated,
    user,
    isLoading: !user && isAuthenticated,
    isCheckingAccess,
  };
}
