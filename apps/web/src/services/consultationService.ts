/**
 * Consultation Service - Consultation API calls
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import type { ApiResponse, Consultation, ConsultationFormData } from '@/types';

export const consultationService = {
  /**
   * Create new consultation
   */
  async createConsultation(data: ConsultationFormData): Promise<Consultation> {
    return await apiClient.post<Consultation>(API_ENDPOINTS.CONSULTATIONS.CREATE, data);
  },

  /**
   * Get user's consultations
   */
  async getMyConsultations(): Promise<Consultation[]> {
    return await apiClient.get<Consultation[]>(API_ENDPOINTS.CONSULTATIONS.MY);
  },

  /**
   * Update consultation
   */
  async updateConsultation(id: string, data: Partial<Consultation>): Promise<Consultation> {
    return await apiClient.patch<Consultation>(API_ENDPOINTS.CONSULTATIONS.UPDATE(id), data);
  },
};
