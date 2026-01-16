/**
 * Appointment Type Definitions
 */

import { AppointmentStatus } from '@prisma/client';
import { AstrologerCategory } from '@jyotish/shared';

// Re-export for convenience
export { AppointmentStatus };
export { AstrologerCategory };

export interface BookAppointmentData {
  clientId: string;
  astrologerId: string;
  scheduledAt: Date;
  duration: number;
  amount: number;
  notes?: string;
}

export interface UpdateAppointmentData {
  status?: string;
  notes?: string;
  rating?: number;
  review?: string;
  cancellationNote?: string;
}

export interface AppointmentEntity {
  id: string;
  clientId: string;
  astrologerId: string;
  scheduledAt: Date;
  duration: number;
  status: AppointmentStatus;
  amount: number;
  notes: string | null;
  rating: number | null;
  review: string | null;
  cancellationNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentWithRelations extends AppointmentEntity {
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

export interface CheckAvailabilityQuery {
  astrologerId: string;
  date: string; // YYYY-MM-DD format
}

export interface TimeSlot {
  time: string; // HH:MM format
  available: boolean;
  bookedBy?: string; // Client name if booked
}
