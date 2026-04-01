'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { authApi } from '@/lib/auth-api';
import { ROUTES, QUERY_KEYS } from '@/constants';
import { displayError, displaySuccess } from '@/utils/error-handler';
import { UserRole } from '@/types';

type OAuthProvider = 'google' | 'facebook';

interface UseOAuthProfileCompleteOptions {
  provider: OAuthProvider;
  successMessage: string;
}

/**
 * After browser OAuth redirect, the API has set httpOnly cookies; fetch /me once via TanStack Query.
 */
export function useOAuthProfileComplete({
  provider,
  successMessage,
}: UseOAuthProfileCompleteOptions) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const finishedRef = useRef(false);

  const success = searchParams.get('success');
  const errorParam = searchParams.get('error');

  const shouldFetch = success === 'true' && !errorParam;

  const query = useQuery({
    queryKey: QUERY_KEYS.AUTH.OAUTH_COMPLETE(provider),
    queryFn: () => authApi.getProfile(),
    enabled: shouldFetch,
    retry: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (finishedRef.current) return;

    if (errorParam) {
      finishedRef.current = true;
      displayError(new Error(errorParam));
      router.replace(ROUTES.LOGIN);
      return;
    }

    if (success !== 'true') {
      finishedRef.current = true;
      displayError(new Error('Sign-in failed. Please try again.'));
      router.replace(ROUTES.LOGIN);
    }
  }, [errorParam, success, router]);

  useEffect(() => {
    if (finishedRef.current || !query.isSuccess || !query.data) return;
    finishedRef.current = true;
    setAuth(query.data);
    displaySuccess(successMessage);
    const dashboardRoute =
      query.data.role === UserRole.ASTROLOGER ? ROUTES.JYOTISH_DASHBOARD : ROUTES.DASHBOARD;
    window.location.href = dashboardRoute;
  }, [query.isSuccess, query.data, setAuth, successMessage]);

  useEffect(() => {
    if (!query.isError || finishedRef.current) return;
    finishedRef.current = true;
    console.error('OAuth profile fetch failed:', query.error);
    displayError(query.error);
    router.replace(ROUTES.LOGIN);
  }, [query.isError, query.error, router]);

  return {
    isLoading: shouldFetch && (query.isPending || query.isFetching),
    hasParamError: Boolean(errorParam) || (success !== 'true' && success !== null),
  };
}
