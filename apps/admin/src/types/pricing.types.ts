/**
 * Pricing-related type definitions for admin
 */

export interface PricingPlan {
  id: string;
  name: string;
  description: string | null;
  priceInNrs: number;
  coins: number;
  validityInDays: number | null;
  isUnlimited: boolean;
  discountPercent: number | null;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetAllPricingPlansResponse {
  plans: PricingPlan[];
}

export interface GetPricingPlanResponse {
  plan: PricingPlan;
}

export interface CreatePricingPlanRequest {
  name: string;
  description?: string;
  priceInNrs: number;
  coins: number;
  validityInDays?: number;
  isUnlimited?: boolean;
  discountPercent?: number;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface UpdatePricingPlanRequest {
  name?: string;
  description?: string;
  priceInNrs?: number;
  coins?: number;
  validityInDays?: number;
  isUnlimited?: boolean;
  discountPercent?: number;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface DeletePricingPlanResponse {
  message: string;
}


