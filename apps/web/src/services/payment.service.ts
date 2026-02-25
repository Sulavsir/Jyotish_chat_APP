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
  CreateFonepayQrOrderRequest,
  CreateFonepayQrOrderResponse,
  VerifyFonepayQrRequest,
  VerifyFonepayQrResponse,
  CreateFonepayCardOrderRequest,
  CreateFonepayCardOrderResponse,
} from '@/types/payment.types';

export const paymentService = {
  createOrder(body: CreateOrderRequest): Promise<CreateOrderResponse> {
    return apiClient.post<CreateOrderResponse>(API_ENDPOINTS.PAYMENTS.CREATE_ORDER, body);
  },

  verifyPayment(body: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    return apiClient.post<VerifyPaymentResponse>(API_ENDPOINTS.PAYMENTS.VERIFY, body);
  },

  createFonepayQrOrder(
    body: CreateFonepayQrOrderRequest
  ): Promise<CreateFonepayQrOrderResponse> {
    return apiClient.post<CreateFonepayQrOrderResponse>(
      API_ENDPOINTS.PAYMENTS.CREATE_FONEPAY_QR_ORDER,
      body
    );
  },

  verifyFonepayQr(body: VerifyFonepayQrRequest): Promise<VerifyFonepayQrResponse> {
    return apiClient.post<VerifyFonepayQrResponse>(
      API_ENDPOINTS.PAYMENTS.VERIFY_FONEPAY_QR,
      body
    );
  },

  createFonepayCardOrder(
    body: CreateFonepayCardOrderRequest
  ): Promise<CreateFonepayCardOrderResponse> {
    return apiClient.post<CreateFonepayCardOrderResponse>(
      API_ENDPOINTS.PAYMENTS.CREATE_FONEPAY_CARD_ORDER,
      body
    );
  },
} as const;

export default paymentService;
