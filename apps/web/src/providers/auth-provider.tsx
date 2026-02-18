'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { authApi } from '@/lib/auth-api';
import { hasAstrologerPermissionData } from '@/lib/auth';
import { LoadingScreen } from '@/components/ui';
import { ROUTES, USER_ROLES } from '@/constants';
import type { User } from '@/types/auth';

// Public routes that don't need authentication check
const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.ABOUT,
  ROUTES.VERIFY_OTP,
  ROUTES.SET_PASSWORD,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.PRICING,
  ROUTES.ASTROLOGERS, // listing is public
  ROUTES.HOROSCOPES, // public horoscope page - view all rashis
  ROUTES.SUBHA_SAHIT, // public Subha Sahit dates page
  ROUTES.JYOTISH_LOGIN,
  ROUTES.JYOTISH_VERIFY_OTP,
  ROUTES.JYOTISH_SET_PASSWORD,
  ROUTES.JYOTISH_PROFILE_SETUP,
];

const isPublicRoutePath = (pathname: string | null) => {
  if (!pathname) return false;
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true; // Prevent state updates after unmount

    const initializeAuth = async () => {
      const { setAuth, logout, user: currentUser } = useAuthStore.getState();

      // Skip auth check for public routes to avoid unnecessary 401 errors
      const isPublicRoute = isPublicRoutePath(pathname);

      if (isPublicRoute) {
        // For public routes, just mark as initialized without checking auth
        if (isMounted) setIsInitialized(true);
        return;
      }

      // Check if this is an astrologer route
      const isAstrologerRoute = pathname?.startsWith('/jyotish');

      // If user is already in store, check if their role matches the route
      if (currentUser) {
        const userRoleMatchesRoute =
          (currentUser.role === USER_ROLES.ASTROLOGER && isAstrologerRoute) ||
          (currentUser.role === USER_ROLES.CLIENT && !isAstrologerRoute);

        if (userRoleMatchesRoute) {
          // On jyotish routes, ensure we have profile with permissions (from /me) so nav/access work in production
          if (isAstrologerRoute && currentUser.role === USER_ROLES.ASTROLOGER) {
            if (!hasAstrologerPermissionData(currentUser as User)) {
              try {
                const astrologer = await authApi.getAstrologerProfile();
                if (isMounted) setAuth(astrologer);
              } catch (e) {
                console.warn('Failed to refresh astrologer profile for permissions:', e);
              }
            }
          }
          if (isMounted) setIsInitialized(true);
          return;
        } else {
          // Role doesn't match route - redirect to their correct dashboard
          if (typeof window !== 'undefined') {
            const correctDashboard =
              currentUser.role === USER_ROLES.ASTROLOGER
                ? ROUTES.JYOTISH_DASHBOARD
                : ROUTES.DASHBOARD;
            window.location.replace(correctDashboard);
            return;
          }
        }
      }

      // For protected routes, validate session by fetching user/astrologer profile
      try {
        let fetchedUser;

        if (isAstrologerRoute) {
          // Fetch astrologer profile for jyotish routes
          const astrologer = await authApi.getAstrologerProfile();
          if (!isMounted) return;
          fetchedUser = astrologer;
          setAuth(astrologer);
        } else {
          // Fetch user profile for regular routes - but ONLY for client routes
          const user = await authApi.getProfile();
          if (!isMounted) return;
          fetchedUser = user;
          setAuth(user);
        }

        // After fetching, verify the role matches the route
        if (fetchedUser) {
          const roleMatchesRoute =
            (fetchedUser.role === USER_ROLES.ASTROLOGER && isAstrologerRoute) ||
            (fetchedUser.role === USER_ROLES.CLIENT && !isAstrologerRoute);

          if (!roleMatchesRoute) {
            // Role doesn't match - redirect to their correct dashboard
            if (typeof window !== 'undefined') {
              const correctDashboard =
                fetchedUser.role === USER_ROLES.ASTROLOGER
                  ? ROUTES.JYOTISH_DASHBOARD
                  : ROUTES.DASHBOARD;
              window.location.replace(correctDashboard);
              return;
            }
          }
        }
      } catch (error: unknown) {
        const status =
          error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined;
        const isAuthError = status === 401 || status === 403;

        if (isAuthError) {
          console.log('❌ Session expired or invalid');

          // Clear auth store to prevent retry loops
          await logout();

          // Don't set initialized - let the protected route handle redirect
          // This prevents the infinite loop
          return;
        }

        // For other errors, log and continue
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.log('No active session or error fetching profile:', message);
      }

      if (isMounted) setIsInitialized(true);
    };

    initializeAuth();

    return () => {
      isMounted = false; // Cleanup to prevent state updates after unmount
    };
  }, [pathname]); // Re-run when pathname changes

  // Show loading only for protected routes
  const isPublicRoute = isPublicRoutePath(pathname);
  if (!isInitialized && !isPublicRoute) {
    return <LoadingScreen message="Loading your session" />;
  }

  return <>{children}</>;
}
