'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AppVersionApiResponse } from '@jyotish/shared';
import { MaintenanceScreen } from '@jyotish/ui';
import { API_BASE_URL, API_VERSION_PATH } from '@/constants/api.constants';
import { ADMIN_QUERY_KEYS } from '@/constants/query-keys.constants';

async function fetchAppVersion(): Promise<AppVersionApiResponse> {
  const url = `${API_BASE_URL}${API_VERSION_PATH}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Version check failed: ${res.status}`);
  }
  return res.json() as Promise<AppVersionApiResponse>;
}

/**
 * Polls GET /api/version for `maintenance` (API only; see apps/api/.env MAINTENANCE_MODE).
 * Fail-open if the API cannot be reached.
 */
export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.APP_VERSION,
    queryFn: fetchAppVersion,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cosmic-purple border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return <>{children}</>;
  }

  if (data.maintenance) {
    return (
      <MaintenanceScreen
        variant="admin"
        onRetry={() => {
          void queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.APP_VERSION });
        }}
      />
    );
  }

  return <>{children}</>;
}
