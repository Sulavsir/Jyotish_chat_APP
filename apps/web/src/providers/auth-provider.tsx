'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { authApi } from '@/lib/auth-api';
import { LoadingScreen } from '@/components/ui';

// Public routes that don't need authentication check
const PUBLIC_ROUTES = ['/', '/auth/login', '/auth/signup', '/jyotish/login'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const initializeAuth = async () => {
      const { setAuth } = useAuthStore.getState();

      // Skip auth check for public routes to avoid unnecessary 401 errors
      const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route);

      if (isPublicRoute) {
        // For public routes, just mark as initialized without checking auth
        setIsInitialized(true);
        return;
      }

      // For protected routes, validate session by fetching user profile
      try {
        const user = await authApi.getProfile();
        setAuth(user);
      } catch (error) {
        // No valid session - this is normal for logged out users on public pages
        // The protected route components will handle redirecting to login
        console.log('No active session');
      }

      setIsInitialized(true);
    };

    initializeAuth();
  }, [pathname]); // Re-run when pathname changes

  // Show loading only for protected routes
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route);
  if (!isInitialized && !isPublicRoute) {
    return <LoadingScreen message="Loading your session" />;
  }

  return <>{children}</>;
}
