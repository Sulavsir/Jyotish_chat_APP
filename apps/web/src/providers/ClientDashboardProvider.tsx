'use client';

import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import { getClientDashboardStats } from '@/services/clientDashboard.service';
import { useQuestionnaireLanguageStore } from '@/store/questionnaire-language.store';
import { useAuthStore } from '@/store/auth-store';
import { UserRole } from '@/types/user.types';
import type { ClientDashboardStats } from '@/services/clientDashboard.service';

interface ClientDashboardContextValue {
  stats: ClientDashboardStats | undefined;
  isLoading: boolean;
  isError: boolean;
}

const ClientDashboardContext = createContext<ClientDashboardContextValue | null>(null);

export function useClientDashboard() {
  const ctx = useContext(ClientDashboardContext);
  return ctx;
}

interface ClientDashboardProviderProps {
  children: React.ReactNode;
}

export function ClientDashboardProvider({ children }: ClientDashboardProviderProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const language = useQuestionnaireLanguageStore((s) => s.language);

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: [...QUERY_KEYS.CLIENT_DASHBOARD.STATS(language), 'layout'],
    queryFn: () => getClientDashboardStats(language),
    enabled: user?.role === UserRole.CLIENT,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Sync balance to COINS.BALANCE cache so CoinDisplay and other consumers use it
  React.useEffect(() => {
    if (stats?.balance !== undefined) {
      queryClient.setQueryData(QUERY_KEYS.COINS.BALANCE, { balance: stats.balance });
    }
  }, [stats?.balance, queryClient]);

  // Sync rates to COINS.RATES cache
  React.useEffect(() => {
    if (stats?.rates) {
      queryClient.setQueryData(QUERY_KEYS.COINS.RATES, { rates: stats.rates });
    }
  }, [stats?.rates, queryClient]);

  const value: ClientDashboardContextValue = {
    stats,
    isLoading,
    isError,
  };

  return (
    <ClientDashboardContext.Provider value={value}>
      {children}
    </ClientDashboardContext.Provider>
  );
}
