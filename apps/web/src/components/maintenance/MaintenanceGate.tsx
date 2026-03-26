'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AppVersionApiResponse } from '@jyotish/shared';
import { MaintenanceScreen } from '@jyotish/ui';
import { API_BASE_URL, API_VERSION_PATH } from '@/constants/api.constants';
import { QUERY_KEYS } from '@/constants/query-keys.constants';

async function fetchAppVersion(): Promise<AppVersionApiResponse> {
  const url = `${API_BASE_URL}${API_VERSION_PATH}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Version check failed: ${res.status}`);
  }
  return res.json() as Promise<AppVersionApiResponse>;
}

/**
 * Polls GET /api/version for `maintenance` (driven only by API `MAINTENANCE_MODE` in apps/api/.env).
 * When unset/false on API, the app renders normally. When API is unreachable, children are shown (fail-open).
 */
export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.APP_VERSION,
    queryFn: fetchAppVersion,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-muted/30">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return <>{children}</>;
  }

  if (data.maintenance) {
    return (
      <MaintenanceScreen
        onRetry={() => {
          void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APP_VERSION });
        }}
      />
    );
  }

  return <>{children}</>;
}
