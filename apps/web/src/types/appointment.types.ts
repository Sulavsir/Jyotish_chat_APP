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
  bookingType?: BookingType;
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
    chatMessageCommissionPercent?: number;
    broadcastMessageCommissionPercent?: number;
    firstBroadcastCommissionPercent?: number;
    kundaliReviewCommissionPercent?: number;
    appointmentCommissionPercent?: number;
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

/** Appointment for Full Kundali Review (only booking type). */
export type BookingType = 'KUNDALI_REVIEW';

export interface AstrologerSlot {
  id: string;
  astrologerId: string;
  startAt: string;
  endAt: string;
  slotType: BookingType;
  status: 'AVAILABLE' | 'BOOKED';
  appointmentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  time: string; // HH:MM format
  available: boolean;
  bookedBy?: string; // Client name if booked
}

export interface CreateAppointmentData {
  astrologerId: string;
  scheduledAt?: string;
  duration?: number;
  notes?: string;
  slotId?: string;
  bookingType?: BookingType;
}

export interface UpdateAppointmentData {
  status?: AppointmentStatus;
  notes?: string;
  rating?: number;
  review?: string;
  cancellationNote?: string;
}



