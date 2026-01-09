/**
 * Appointment Service (Frontend)
 * Handles appointment-related API calls
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api.constants';
import type {
  Appointment,
  CreateAppointmentData,
  UpdateAppointmentData,
  TimeSlot,
  Astrologer,
} from '@/types/appointment.types';

/**
 * Create a new appointment
 */
export const createAppointment = async (data: CreateAppointmentData): Promise<Appointment> => {
  return apiClient.post<Appointment>(API_ENDPOINTS.APPOINTMENTS.CREATE, data);
};

/**
 * Get all appointments for the current user
 */
export const getMyAppointments = async (status?: string): Promise<Appointment[]> => {
  const params = status ? { status } : {};
  return apiClient.get<Appointment[]>(API_ENDPOINTS.APPOINTMENTS.MY, { params });
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
  getMyAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  confirmAppointment,
  checkAvailability,
  getAstrologersForAppointment,
};

export default appointmentService;
