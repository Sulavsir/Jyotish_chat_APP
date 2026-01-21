/**
 * Appointment Types for Admin Panel
 */

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum AstrologerCategory {
  ORDINARY = 'ORDINARY',
  PROFESSIONAL = 'PROFESSIONAL',
  PREMIUM = 'PREMIUM',
  KATHA_VACHAK = 'KATHA_VACHAK',
}

export interface AppointmentClient {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
}

export interface AppointmentAstrologer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  category: AstrologerCategory;
  appointmentFee: number | null;
}

export interface Appointment {
  id: string;
  scheduledAt: string;
  duration: number;
  status: AppointmentStatus;
  amount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  client: AppointmentClient;
  astrologer: AppointmentAstrologer;
}
