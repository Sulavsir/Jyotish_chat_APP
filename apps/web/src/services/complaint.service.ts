/**
 * Complaint Service
 * Handles API calls for user complaints
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api.constants';
import type {
  Complaint,
  CreateComplaintData,
  ComplaintListResponse,
  ComplaintStatus,
} from '@/types/complaint';

class ComplaintService {
  /**
   * Create a new complaint
   */
  async createComplaint(
    data: CreateComplaintData
  ): Promise<{ complaint: Complaint; message: string }> {
    // If attachment is provided, send as FormData
    if (data.attachment) {
      const formData = new FormData();
      formData.append('astrologerId', data.astrologerId);
      if (data.chatId) formData.append('chatId', data.chatId);
      formData.append('subject', data.subject);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('attachment', data.attachment);

      const response = await apiClient.uploadFile<{ complaint: Complaint; message: string }>(
        API_ENDPOINTS.COMPLAINTS.CREATE,
        formData
      );
      return response;
    }

    // No attachment, send as JSON
    const { attachment, ...jsonData } = data;
    const response = await apiClient.post<{ complaint: Complaint; message: string }>(
      API_ENDPOINTS.COMPLAINTS.CREATE,
      jsonData
    );
    return response;
  }

  /**
   * Get user's complaints
   */
  async getComplaints(params?: {
    status?: ComplaintStatus;
    limit?: number;
    offset?: number;
  }): Promise<ComplaintListResponse> {
    const response = await apiClient.get<ComplaintListResponse>(API_ENDPOINTS.COMPLAINTS.LIST, {
      params,
    });
    return response;
  }

  /**
   * Get a single complaint by ID
   */
  async getComplaintById(id: string): Promise<{ complaint: Complaint }> {
    const response = await apiClient.get<{ complaint: Complaint }>(
      API_ENDPOINTS.COMPLAINTS.DETAIL(id)
    );
    return response;
  }
}

export const complaintService = new ComplaintService();
export default complaintService;
