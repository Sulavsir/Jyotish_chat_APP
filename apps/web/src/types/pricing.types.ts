/**
 * Pricing Plan Types
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
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: number;
}

export interface PricingPlansResponse {
  plans: PricingPlan[];
}
