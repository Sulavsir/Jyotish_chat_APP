/**
 * Appointment Service (Frontend)
 * Handles appointment-related API calls
 */

import { apiClient, axiosInstance } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api.constants';
import type {
  Appointment,
  CreateAppointmentData,
  UpdateAppointmentData,
  TimeSlot,
  Astrologer,
  AstrologerSlot,
  BookingType,
} from '@/types/appointment.types';
import type { AppointmentStatus } from '@/types/appointment.types';

type ListMyAppointmentsResponse = {
  appointments: Appointment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

/**
 * List available slots for an astrologer (for booking appointment or kundali review).
 */
export const listAvailableSlots = async (
  astrologerId: string,
  params: { slotType: BookingType; fromDate?: string; toDate?: string }
): Promise<{ slots: AstrologerSlot[] }> => {
  return apiClient.get<{ slots: AstrologerSlot[] }>(API_ENDPOINTS.APPOINTMENTS.SLOTS(astrologerId), {
    params,
  });
};

/** API response body when creating an appointment (includes backend message for toast). */
export type CreateAppointmentResponse = {
  data: Appointment;
  message?: string;
  success?: boolean;
};

/**
 * Create a new appointment. With slotId + bookingType, books the slot and is directly confirmed.
 * Returns the full response body so the UI can show the backend message (e.g. toast).
 */
export const createAppointment = async (
  data: CreateAppointmentData
): Promise<CreateAppointmentResponse> => {
  const response = await axiosInstance.post<CreateAppointmentResponse>(
    API_ENDPOINTS.APPOINTMENTS.CREATE,
    data
  );
  return response.data;
};

/**
 * Get all appointments for the current user.
 * Use status for a single status, or statuses for multiple (e.g. IN_PROGRESS,COMPLETED for consultations).
 */
export const listMine = async (params: {
  page: number;
  limit: number;
  search?: string;
  status?: AppointmentStatus | string;
  statuses?: string;
}): Promise<ListMyAppointmentsResponse> => {
  return apiClient.get<ListMyAppointmentsResponse>(API_ENDPOINTS.APPOINTMENTS.MY, { params });
};

// Backward-compatible helper used by existing pages
export const getMyAppointments = async (status?: string): Promise<Appointment[]> => {
  const data = await listMine({
    page: 1,
    limit: 1000,
    status: status || undefined,
  });
  return data.appointments;
};

/**
 * Get a single appointment by ID
 */
export const getAppointmentById = async (id: string): Promise<Appointment> => {
  return apiClient.get<Appointment>(API_ENDPOINTS.APPOINTMENTS.DETAIL(id));
};

/**
 * Update an appointment
 */
export const updateAppointment = async (
  id: string,
  data: UpdateAppointmentData
): Promise<Appointment> => {
  return apiClient.patch<Appointment>(API_ENDPOINTS.APPOINTMENTS.UPDATE(id), data);
};

/**
 * Cancel an appointment
 */
export const cancelAppointment = async (
  id: string,
  cancellationNote?: string
): Promise<Appointment> => {
  return apiClient.post<Appointment>(API_ENDPOINTS.APPOINTMENTS.CANCEL(id), {
    cancellationNote,
  });
};

/**
 * Confirm an appointment (astrologer only)
 */
export const confirmAppointment = async (id: string): Promise<Appointment> => {
  return apiClient.post<Appointment>(API_ENDPOINTS.APPOINTMENTS.CONFIRM(id));
};

/**
 * Check availability for an astrologer on a specific date
 */
export const checkAvailability = async (
  astrologerId: string,
  date: string
): Promise<TimeSlot[]> => {
  return apiClient.get<TimeSlot[]>(API_ENDPOINTS.APPOINTMENTS.AVAILABILITY(astrologerId), {
    params: { date },
  });
};

/**
 * Get all astrologers (for appointment booking)
 */
export const getAstrologersForAppointment = async (): Promise<Astrologer[]> => {
  return apiClient.get<Astrologer[]>(API_ENDPOINTS.ASTROLOGER.LIST, {
    params: { forAppointments: true },
  });
};

const appointmentService = {
  createAppointment,
  listAvailableSlots,
  getMyAppointments,
  listMine,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  confirmAppointment,
  checkAvailability,
  getAstrologersForAppointment,
};

export default appointmentService;
