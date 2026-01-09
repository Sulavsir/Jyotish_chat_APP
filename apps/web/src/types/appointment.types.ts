/**
 * Appointment Type Definitions (Frontend)
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
  ORDINARY = 'ORDINARY',       // Can receive chat requests, no appointments
  PROFESSIONAL = 'PROFESSIONAL', // Can receive chat requests and appointments, lower fee
  PREMIUM = 'PREMIUM',          // Only appointments, no direct chat (higher fee)
}

export interface Appointment {
  id: string;
  clientId: string;
  astrologerId: string;
  scheduledAt: string;
  duration: number;
  status: AppointmentStatus;
  amount: number;
  notes: string | null;
  rating: number | null;
  review: string | null;
  cancellationNote: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
    profilePhoto: string | null;
  };
  astrologer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    profilePhoto: string | null;
    category: AstrologerCategory;
    appointmentFee: number | null;
  };
}

export interface Astrologer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  profilePhoto: string | null;
  bio: string | null;
  specialization: string[];
  experience: number | null;
  rating: number;
  totalConsultations: number;
  category: AstrologerCategory;
  appointmentFee: number | null;
  isActive: boolean;
  isOnline: boolean;
  isVerified: boolean;
  languages: string[];
}

export interface TimeSlot {
  time: string; // HH:MM format
  available: boolean;
  bookedBy?: string; // Client name if booked
}

export interface CreateAppointmentData {
  astrologerId: string;
  scheduledAt: string;
  duration?: number;
  notes?: string;
}

export interface UpdateAppointmentData {
  status?: AppointmentStatus;
  notes?: string;
  rating?: number;
  review?: string;
  cancellationNote?: string;
}



