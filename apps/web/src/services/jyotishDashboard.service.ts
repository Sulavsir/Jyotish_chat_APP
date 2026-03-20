/**
 * Jyotish Dashboard Service
 * Fetches consolidated dashboard stats from a single API endpoint.
 * Replaces multiple calls (appointments/my, consultations/my, conversations, tips/today).
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import type { QuestionnaireLanguage } from '@jyotish/shared';

export interface JyotishDashboardStats {
  todaysConsultations: {
    total: number;
    completed: number;
    upcoming: number;
  };
  totalConsultations: number;
  pendingChats: {
    total: number;
    urgent: number;
  };
  monthlyEarnings: {
    amount: number;
    currency: string;
    changePercent: number;
  };
  recentActivity: RecentActivity[];
  todayTip: { text: string };
}

export interface RecentActivity {
  id: string;
  type: 'consultation' | 'chat' | 'appointment';
  title: string;
  description: string;
  clientName: string;
  timestamp: Date;
  avatar?: string | null;
}

interface BackendRecentActivityItem {
  id: string;
  type: 'consultation' | 'chat' | 'appointment';
  title: string;
  description: string;
  clientName: string;
  timestamp: string;
  avatar?: string | null;
}

interface BackendDashboardStats {
  todaysConsultations: JyotishDashboardStats['todaysConsultations'];
  totalConsultations: number;
  pendingChats: JyotishDashboardStats['pendingChats'];
  monthlyEarnings: JyotishDashboardStats['monthlyEarnings'];
  recentActivity: BackendRecentActivityItem[];
  todayTip: { text: string };
}

function normalizeRecentActivity(items: BackendRecentActivityItem[]): RecentActivity[] {
  return items.map((item) => ({
    ...item,
    timestamp: new Date(item.timestamp),
  }));
}

class JyotishDashboardService {
  async getDashboardStats(language?: QuestionnaireLanguage): Promise<JyotishDashboardStats> {
    const response = await apiClient.get<BackendDashboardStats>(
      API_ENDPOINTS.ASTROLOGER.DASHBOARD_STATS,
      { params: language ? { language } : undefined }
    );

    return {
      ...response,
      recentActivity: normalizeRecentActivity(response.recentActivity ?? []),
    };
  }
}

const jyotishDashboardService = new JyotishDashboardService();

export default jyotishDashboardService;
