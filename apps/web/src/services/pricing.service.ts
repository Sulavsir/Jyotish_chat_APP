/**
 * Pricing Service
 * Handles pricing plan API calls
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants';
import type { PricingPlansResponse, PricingPlan } from '@/types/pricing.types';

class PricingService {
  /**
   * Get all active pricing plans
   */
  async getPlans(): Promise<PricingPlansResponse> {
    const response = await apiClient.get<{ plans: PricingPlan[] }>(API_ENDPOINTS.PRICING);
    return { plans: response.plans || [] };
  }
}

export const pricingService = new PricingService();
export default pricingService;
