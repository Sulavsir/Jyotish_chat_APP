/**
 * Hook to redirect authenticated users away from public/auth pages
 * Used on pages like login, signup, home page where authenticated users shouldn't be
 */

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { ROUTES } from '@/constants';
import { UserRole } from '@/types';

export function useRedirectIfAuthenticated() {
  const { isAuthenticated, user } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect to appropriate dashboard based on role
      const dashboardRoute =
        user.role === UserRole.ASTROLOGER ? ROUTES.JYOTISH_DASHBOARD : ROUTES.DASHBOARD;
      window.location.href = dashboardRoute;
    } else {
      // Not authenticated, safe to show the page content
      setIsCheckingAuth(false);
    }
  }, [isAuthenticated, user]);

  return { isCheckingAuth };
}
