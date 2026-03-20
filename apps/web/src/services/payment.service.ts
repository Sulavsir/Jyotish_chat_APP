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
  MySuccessfulPaymentsResponse,
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

  getMyPayments(params?: { page?: number; limit?: number }): Promise<MySuccessfulPaymentsResponse> {
    const search = new URLSearchParams();
    if (params?.page != null) search.set('page', String(params.page));
    if (params?.limit != null) search.set('limit', String(params.limit));
    const qs = search.toString();
    const url = qs ? `${API_ENDPOINTS.PAYMENTS.MY_PAYMENTS}?${qs}` : API_ENDPOINTS.PAYMENTS.MY_PAYMENTS;
    return apiClient.get<MySuccessfulPaymentsResponse>(url);
  },
} as const;

export default paymentService;
