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
  todaysEarnings: {
    amount: number;
    currency: string;
    transactionCount: number;
    bySource: Record<
      'CHAT_MESSAGE' | 'BROADCAST_MESSAGE' | 'APPOINTMENT' | 'KUNDALI_REVIEW',
      number
    >;
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

export interface OnlineAstrologer {
  id: string;
  name: string;
  profilePhoto: string | null;
  category: string;
  rating: number;
  totalConsultations: number;
  isOnline: boolean;
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
  todaysEarnings: JyotishDashboardStats['todaysEarnings'];
  monthlyEarnings: JyotishDashboardStats['monthlyEarnings'];
  recentActivity: BackendRecentActivityItem[];
  todayTip: { text: string };
}

interface OnlineAstrologersResponse {
  onlineAstrologers: OnlineAstrologer[];
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

  async getOnlineAstrologers(limit: number = 12): Promise<OnlineAstrologer[]> {
    const response = await apiClient.get<OnlineAstrologersResponse>(
      API_ENDPOINTS.ASTROLOGER.DASHBOARD_ONLINE_ASTROLOGERS,
      { params: { limit } }
    );
    return response.onlineAstrologers ?? [];
  }
}

const jyotishDashboardService = new JyotishDashboardService();

export default jyotishDashboardService;
