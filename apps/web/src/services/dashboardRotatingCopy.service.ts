/**
 * Dashboard Rotating Copy Service (Public)
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import type { DashboardRotatingCopy } from '@/types';

type ListPublicDashboardRotatingCopyResponse = {
  items: DashboardRotatingCopy[];
};

export const dashboardRotatingCopyService = {
  async listPublic(): Promise<DashboardRotatingCopy[]> {
    const data = await apiClient.get<ListPublicDashboardRotatingCopyResponse>(
      API_ENDPOINTS.PUBLIC.DASHBOARD_ROTATING_COPY
    );
    return data.items;
  },
} as const;

export default dashboardRotatingCopyService;

