/**
 * Seed Pricing Plans
 * Run with: pnpm prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const pricingPlans = [
  {
    name: '10 Chat Pack',
    description: 'Perfect for occasional consultations',
    priceInNrs: 1000,
    coins: 10,
    validityInDays: null, // Permanent
    isUnlimited: false,
    discountPercent: null,
    isActive: true,
    isFeatured: false,
    displayOrder: 1,
  },
  {
    name: '1 Day Unlimited',
    description: 'Unlimited chats with any jyotish for 24 hours',
    priceInNrs: 1000,
    coins: 0, // Not applicable for unlimited
    validityInDays: 1,
    isUnlimited: true,
    discountPercent: null,
    isActive: true,
    isFeatured: true,
    displayOrder: 2,
  },
  {
    name: '50 Chat Pack',
    description: 'Best value for regular users',
    priceInNrs: 4500,
    coins: 50,
    validityInDays: null,
    isUnlimited: false,
    discountPercent: 10, // 10% discount
    isActive: true,
    isFeatured: true,
    displayOrder: 3,
  },
  {
    name: '3 Day Unlimited',
    description: 'Unlimited chats for 3 days',
    priceInNrs: 2500,
    coins: 0,
    validityInDays: 3,
    isUnlimited: true,
    discountPercent: 15,
    isActive: true,
    isFeatured: false,
    displayOrder: 4,
  },
  {
    name: '100 Chat Pack',
    description: 'Maximum value for power users',
    priceInNrs: 8000,
    coins: 100,
    validityInDays: null,
    isUnlimited: false,
    discountPercent: 20, // 20% discount
    isActive: true,
    isFeatured: true,
    displayOrder: 5,
  },
  {
    name: '7 Day Unlimited',
    description: 'Unlimited chats for a full week',
    priceInNrs: 5000,
    coins: 0,
    validityInDays: 7,
    isUnlimited: true,
    discountPercent: 25,
    isActive: true,
    isFeatured: false,
    displayOrder: 6,
  },
];

async function seedPricingPlans() {
  console.log('🌱 Seeding pricing plans...');

  for (const plan of pricingPlans) {
    const existing = await prisma.pricingPlan.findFirst({
      where: { name: plan.name },
    });

    if (existing) {
      console.log(`✅ Pricing plan "${plan.name}" already exists, skipping...`);
      continue;
    }

    await prisma.pricingPlan.create({
      data: plan,
    });

    console.log(`✅ Created pricing plan: ${plan.name}`);
  }

  console.log('🎉 Pricing plans seeded successfully!');
}

seedPricingPlans()
  .catch((e) => {
    console.error('❌ Error seeding pricing plans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

