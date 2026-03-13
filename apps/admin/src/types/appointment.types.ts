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
  commissionRate?: number;
}

/** Appointment for Full Kundali Review (only booking type). */
export type BookingType = 'KUNDALI_REVIEW';

export interface Appointment {
  id: string;
  scheduledAt: string;
  duration: number;
  status: AppointmentStatus;
  amount: number;
  bookingType?: BookingType;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  client: AppointmentClient;
  astrologer: AppointmentAstrologer;
}

/** Pagination meta for list endpoints */
export interface AppointmentsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** API response for GET /api/v1/admin/appointments (paginated list) */
export interface ListAppointmentsResponse {
  appointments: Appointment[];
  pagination: AppointmentsPagination;
}

/** Params for listing appointments (admin) */
export interface ListAppointmentsParams {
  page?: number;
  limit?: number;
  status?: AppointmentStatus | string;
}

/** Payload for cancelling an appointment (admin) */
export interface CancelAppointmentPayload {
  cancellationNote?: string;
}
