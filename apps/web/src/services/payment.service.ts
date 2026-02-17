/**
 * Payment service - GetPay create order and verify
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
} from '@/types/payment.types';

export const paymentService = {
  createOrder(body: CreateOrderRequest): Promise<CreateOrderResponse> {
    return apiClient.post<CreateOrderResponse>(API_ENDPOINTS.PAYMENTS.CREATE_ORDER, body);
  },

  verifyPayment(body: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    return apiClient.post<VerifyPaymentResponse>(API_ENDPOINTS.PAYMENTS.VERIFY, body);
  },
} as const;

export default paymentService;
