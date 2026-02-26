/**
 * Seed Nepali date mapping (English ↔ Bikram Sambat).
 * Data from date_miti.sql; reference_id omitted (id is auto-generated).
 * Run as part of: pnpm db:seed (from packages/database)
 */

import type { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

const BATCH_SIZE = 500;

export async function seedNepaliDates(prisma: PrismaClient) {
  const dataPath = path.join(__dirname, 'date_miti_data.json');
  const raw = fs.readFileSync(dataPath, 'utf8');
  const rows = JSON.parse(raw) as Array<{
    englishDate: string;
    nepaliDate: string;
    days: string;
  }>;

  const existing = await prisma.nepaliDate.count();
  if (existing > 0) {
    console.log(`⏭️  NepaliDate already has ${existing} rows, skipping seed`);
    return;
  }

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE).map((r) => ({
      englishDate: new Date(r.englishDate),
      nepaliDate: r.nepaliDate,
      days: r.days,
    }));
    await prisma.nepaliDate.createMany({ data: batch });
    console.log(`✅ NepaliDate: seeded ${Math.min(i + BATCH_SIZE, rows.length)} / ${rows.length}`);
  }

  console.log('🎉 Nepali date seed complete.');
}
