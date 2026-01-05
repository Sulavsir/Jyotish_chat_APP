/**
 * Pricing Service - Handle pricing plan business logic
 */

import { prisma } from '@jyotish/database';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';

export class PricingService {
  /**
   * Get all pricing plans (for customers)
   */
  async getAllPlans(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };

    return await prisma.pricingPlan.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get featured pricing plans
   */
  async getFeaturedPlans() {
    return await prisma.pricingPlan.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
      orderBy: [{ displayOrder: 'asc' }],
    });
  }

  /**
   * Get pricing plan by ID
   */
  async getPlanById(id: string) {
    const plan = await prisma.pricingPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new AppError('Pricing plan not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    return plan;
  }

  /**
   * Create new pricing plan (Admin only)
   */
  async createPlan(data: {
    name: string;
    description?: string;
    priceInNrs: number;
    coins: number;
    validityInDays?: number;
    isUnlimited?: boolean;
    discountPercent?: number;
    isActive?: boolean;
    isFeatured?: boolean;
    displayOrder?: number;
  }) {
    // Validate price
    if (data.priceInNrs <= 0) {
      throw new AppError('Price must be greater than 0', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    // Validate coins for non-unlimited plans
    if (!data.isUnlimited && data.coins <= 0) {
      throw new AppError('Coins must be greater than 0 for non-unlimited plans', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    // Check for duplicate name
    const existing = await prisma.pricingPlan.findFirst({
      where: { name: data.name },
    });

    if (existing) {
      throw new AppError('Pricing plan with this name already exists', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    return await prisma.pricingPlan.create({
      data: {
        name: data.name,
        description: data.description,
        priceInNrs: data.priceInNrs,
        coins: data.coins,
        validityInDays: data.validityInDays,
        isUnlimited: data.isUnlimited || false,
        discountPercent: data.discountPercent,
        isActive: data.isActive !== undefined ? data.isActive : true,
        isFeatured: data.isFeatured || false,
        displayOrder: data.displayOrder || 0,
      },
    });
  }

  /**
   * Update pricing plan (Admin only)
   */
  async updatePlan(
    id: string,
    data: {
      name?: string;
      description?: string;
      priceInNrs?: number;
      coins?: number;
      validityInDays?: number;
      isUnlimited?: boolean;
      discountPercent?: number;
      isActive?: boolean;
      isFeatured?: boolean;
      displayOrder?: number;
    }
  ) {
    // Check if plan exists
    await this.getPlanById(id);

    // Validate price if provided
    if (data.priceInNrs !== undefined && data.priceInNrs <= 0) {
      throw new AppError('Price must be greater than 0', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    }

    // Check for duplicate name if name is being changed
    if (data.name) {
      const existing = await prisma.pricingPlan.findFirst({
        where: {
          name: data.name,
          NOT: { id },
        },
      });

      if (existing) {
        throw new AppError('Pricing plan with this name already exists', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
      }
    }

    return await prisma.pricingPlan.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete pricing plan (Admin only)
   */
  async deletePlan(id: string) {
    // Check if plan exists
    await this.getPlanById(id);

    await prisma.pricingPlan.delete({
      where: { id },
    });

    return { message: 'Pricing plan deleted successfully' };
  }

  /**
   * Toggle plan active status (Admin only)
   */
  async togglePlanStatus(id: string) {
    const plan = await this.getPlanById(id);

    return await prisma.pricingPlan.update({
      where: { id },
      data: { isActive: !plan.isActive },
    });
  }
}

export const pricingService = new PricingService();


