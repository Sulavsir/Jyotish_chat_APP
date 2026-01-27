/**
 * Jyotish Dashboard Service
 * Aggregates data from various services for the astrologer dashboard
 */

import { getConversations } from './chat.service';
import appointmentService from './appointment.service';
import { consultationService } from './consultationService';
import type { Chat } from '@/types/chat';
import type { Appointment, AppointmentStatus } from '@/types/appointment.types';
import type { Consultation, ConsultationType } from '@jyotish/shared';

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

class JyotishDashboardService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<JyotishDashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch data in parallel
    const [appointments, consultations, chats] = await Promise.all([
      appointmentService.getMyAppointments(),
      consultationService.getMyConsultations(),
      getConversations(),
    ]);

    // Filter today's appointments
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

    // Get pending chats (chats with unread messages or recent activity)
    const pendingChats = chats.filter((chat) => {
      const hasUnread = chat.participant2Read === false; // For astrologer (participant2)
      const isRecent = chat.lastMessageAt
        ? new Date(chat.lastMessageAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
        : false;
      return hasUnread || isRecent;
    });

    // Calculate monthly earnings (placeholder - would need earnings API)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyEarnings = {
      amount: 0, // Would need earnings service
      currency: 'NPR',
      changePercent: 12, // Placeholder
    };

    return {
      todaysConsultations: {
        total: todaysAppointments.length,
        completed: todaysCompleted,
        upcoming: todaysUpcoming,
      },
      totalConsultations: consultations.length + appointments.filter((apt) => apt.status === 'COMPLETED').length,
      pendingChats: {
        total: pendingChats.length,
        urgent: pendingChats.filter((chat) => {
          // Urgent: unread messages from last 2 hours
          if (!chat.lastMessageAt) return false;
          const lastMessageTime = new Date(chat.lastMessageAt).getTime();
          const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
          return lastMessageTime > twoHoursAgo && chat.participant2Read === false;
        }).length,
      },
      monthlyEarnings,
    };
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit = 5): Promise<RecentActivity[]> {
    const [appointments, consultations, chats] = await Promise.all([
      appointmentService.getMyAppointments(),
      consultationService.getMyConsultations(),
      getConversations(),
    ]);

    const activities: RecentActivity[] = [];

    // Add recent appointments
    appointments
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .forEach((apt) => {
        activities.push({
          id: apt.id,
          type: 'appointment',
          title: 'New appointment booked',
          description: `Appointment scheduled`,
          clientName: apt.client?.name || apt.client?.phone || 'Client',
          timestamp: new Date(apt.createdAt),
          avatar: apt.client?.profilePhoto || null,
        });
      });

    // Add recent consultations
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

    // Add recent chat messages
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

    // Sort all activities by timestamp and return top N
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

const jyotishDashboardService = new JyotishDashboardService();

export default jyotishDashboardService;
