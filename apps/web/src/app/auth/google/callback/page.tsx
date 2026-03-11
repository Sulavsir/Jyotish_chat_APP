'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { authApi } from '@/lib/auth-api';
import { ROUTES } from '@/constants';
import { LoadingScreenWithBackground } from '@/components/ui';
import { displayError, displaySuccess } from '@/utils/error-handler';
import { UserRole } from '@/types';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (error) {
      displayError(new Error(error));
      router.replace(ROUTES.LOGIN);
      return;
    }

    if (success !== 'true') {
      displayError(new Error('Google authentication failed. Please try again.'));
      router.replace(ROUTES.LOGIN);
      return;
    }

    async function completeAuth() {
      try {
        const user = await authApi.getProfile();
        setAuth(user);
        displaySuccess('Signed in with Google successfully');

        const dashboardRoute =
          user.role === UserRole.ASTROLOGER ? ROUTES.JYOTISH_DASHBOARD : ROUTES.DASHBOARD;
        window.location.href = dashboardRoute;
      } catch (err) {
        console.error('Failed to fetch user profile after Google login:', err);
        displayError(err);
        router.replace(ROUTES.LOGIN);
      }
    }

    completeAuth();
  }, [searchParams, setAuth, router]);

  return <LoadingScreenWithBackground message="Completing sign in..." />;
}
