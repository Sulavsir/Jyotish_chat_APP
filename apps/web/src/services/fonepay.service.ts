/**
 * Fonepay API service – generate QR, check status, tax refund (calls backend only)
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import type {
  FonepayGenerateRequest,
  FonepayGenerateResponse,
  FonepayCheckStatusRequest,
  FonepayStatusResponse,
  FonepayTaxRefundRequest,
} from '@/types/fonepay.types';

export const fonepayService = {
  generateQr(body: FonepayGenerateRequest): Promise<FonepayGenerateResponse> {
    return apiClient.post<FonepayGenerateResponse>(API_ENDPOINTS.FONEPAY.GENERATE_QR, body);
  },

  checkStatus(body: FonepayCheckStatusRequest): Promise<FonepayStatusResponse> {
    return apiClient.post<FonepayStatusResponse>(API_ENDPOINTS.FONEPAY.CHECK_STATUS, body);
  },

  taxRefund(body: FonepayTaxRefundRequest): Promise<{ success: true }> {
    return apiClient.post<{ success: true }>(API_ENDPOINTS.FONEPAY.TAX_REFUND, body);
  },
} as const;

export default fonepayService;
