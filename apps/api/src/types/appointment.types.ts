/**
 * Appointment Type Definitions
 */

import { AppointmentStatus, BookingType, SlotType, SlotStatus } from '@prisma/client';
import { AstrologerCategory } from '@jyotish/shared';

// Re-export for convenience
export { AppointmentStatus, BookingType, SlotType, SlotStatus };
export { AstrologerCategory };

export interface AstrologerSlotRow {
  id: string;
  astrologerId: string;
  startAt: Date;
  endAt: Date;
  slotType: SlotType;
  status: SlotStatus;
  appointmentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookAppointmentData {
  clientId: string;
  astrologerId: string;
  scheduledAt: Date;
  duration: number;
  amount: number;
  notes?: string;
  /** When set, booking uses astrologer-defined slot and is directly CONFIRMED */
  slotId?: string;
  bookingType?: BookingType;
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
  bookingType: BookingType;
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
