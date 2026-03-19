/**
 * Jyotish Dashboard Service
 * Fetches real stats from the backend for the astrologer dashboard
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import { getConversations } from './chat.service';
import appointmentService from './appointment.service';
import { consultationService } from './consultationService';

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

interface BackendDashboardStats {
  pendingChats: number;
  monthlyEarnings: {
    amount: number;
    currency: string;
    changePercent: number;
  };
}

class JyotishDashboardService {
  async getDashboardStats(): Promise<JyotishDashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [appointments, consultations, backendStats] = await Promise.all([
      appointmentService.getMyAppointments(),
      consultationService.getMyConsultations(),
      apiClient.get<BackendDashboardStats>(API_ENDPOINTS.ASTROLOGER.DASHBOARD_STATS).catch(() => ({
        pendingChats: 0,
        monthlyEarnings: { amount: 0, currency: 'NPR', changePercent: 0 },
      } as BackendDashboardStats)),
    ]);

    const todaysAppointments = appointments.filter((apt) => {
      const aptDate = new Date(apt.scheduledAt);
      aptDate.setHours(0, 0, 0, 0);
      return aptDate.getTime() === today.getTime();
    });

    const todaysCompleted = todaysAppointments.filter(
      (apt) => apt.status === 'COMPLETED' || apt.status === 'IN_PROGRESS'
    ).length;
    const todaysUpcoming = todaysAppointments.filter(
      (apt) => apt.status === 'PENDING' || apt.status === 'CONFIRMED'
    ).length;

    return {
      todaysConsultations: {
        total: todaysAppointments.length,
        completed: todaysCompleted,
        upcoming: todaysUpcoming,
      },
      totalConsultations:
        consultations.length + appointments.filter((apt) => apt.status === 'COMPLETED').length,
      pendingChats: {
        total: backendStats.pendingChats,
        urgent: 0,
      },
      monthlyEarnings: backendStats.monthlyEarnings,
    };
  }

  async getRecentActivity(limit = 5): Promise<RecentActivity[]> {
    const [appointments, consultations, chats] = await Promise.all([
      appointmentService.getMyAppointments(),
      consultationService.getMyConsultations(),
      getConversations(),
    ]);

    const activities: RecentActivity[] = [];

    appointments
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .forEach((apt) => {
        activities.push({
          id: apt.id,
          type: 'appointment',
          title: 'New appointment booked',
          description: 'Appointment scheduled',
          clientName: apt.client?.name || apt.client?.phone || 'Client',
          timestamp: new Date(apt.createdAt),
          avatar: apt.client?.profilePhoto || null,
        });
      });

    consultations
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .forEach((consultation) => {
        activities.push({
          id: consultation.id,
          type: 'consultation',
          title: 'New consultation booked',
          description: consultation.type || 'Consultation',
          clientName: 'Client',
          timestamp: new Date(consultation.createdAt),
        });
      });

    chats
      .filter((chat) => chat.lastMessageAt)
      .sort((a, b) => {
        const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, limit)
      .forEach((chat) => {
        activities.push({
          id: chat.id,
          type: 'chat',
          title: 'Chat message received',
          description: chat.lastMessageText || 'New message',
          clientName: chat.clientParticipant.name || 'Client',
          timestamp: chat.lastMessageAt ? new Date(chat.lastMessageAt) : new Date(chat.updatedAt),
          avatar: chat.clientParticipant.profilePhoto || null,
        });
      });

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
  }
}

const jyotishDashboardService = new JyotishDashboardService();

export default jyotishDashboardService;
