/**
 * Seed NepalGeography with English names for provinces and districts.
 * Province number is not stored; nameEn is used for display and selection.
 */

import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

const PROVINCES_DISTRICTS: { provinceNameEn: string; districtsEn: string[] }[] = [
  {
    provinceNameEn: 'Koshi',
    districtsEn: [
      'Bhojpur',
      'Dhankuta',
      'Ilam',
      'Jhapa',
      'Khotang',
      'Morang',
      'Okhaldhunga',
      'Panchthar',
      'Sankhuwasabha',
      'Solukhumbu',
      'Sunsari',
      'Taplejung',
      'Tehrathum',
      'Udayapur',
    ],
  },
  {
    provinceNameEn: 'Madhesh',
    districtsEn: [
      'Bara',
      'Dhanusha',
      'Mahottari',
      'Parsa',
      'Rautahat',
      'Saptari',
      'Sarlahi',
      'Siraha',
    ],
  },
  {
    provinceNameEn: 'Bagmati',
    districtsEn: [
      'Bhaktapur',
      'Chitwan',
      'Dhading',
      'Dolakha',
      'Kathmandu',
      'Kavrepalanchok',
      'Lalitpur',
      'Makwanpur',
      'Nuwakot',
      'Ramechhap',
      'Rasuwa',
      'Sindhuli',
      'Sindhupalchok',
    ],
  },
  {
    provinceNameEn: 'Gandaki',
    districtsEn: [
      'Baglung',
      'Gorkha',
      'Kaski',
      'Lamjung',
      'Manang',
      'Mustang',
      'Myagdi',
      'Nawalpur',
      'Parbat',
      'Syangja',
      'Tanahun',
    ],
  },
  {
    provinceNameEn: 'Lumbini',
    districtsEn: [
      'Arghakhanchi',
      'Banke',
      'Bardiya',
      'Dang',
      'Gulmi',
      'Kapilvastu',
      'Parasi',
      'Palpa',
      'Pyuthan',
      'Rolpa',
      'Rukum East',
      'Rupandehi',
    ],
  },
  {
    provinceNameEn: 'Karnali',
    districtsEn: [
      'Dailekh',
      'Dolpa',
      'Humla',
      'Jajarkot',
      'Jumla',
      'Kalikot',
      'Mugu',
      'Rukum West',
      'Salyan',
      'Surkhet',
    ],
  },
  {
    provinceNameEn: 'Sudurpashchim',
    districtsEn: [
      'Achham',
      'Baitadi',
      'Bajura',
      'Dadeldhura',
      'Darchula',
      'Doti',
      'Kailali',
      'Kanchanpur',
    ],
  },
];

/**
 * Merge duplicate top-level PROVINCE rows (same nameEn). Keeps the row with the most
 * districts; tie-break on lexicographically smallest id. Moves districts and FKs, then deletes extras.
 */
async function dedupeDuplicateProvinces(prisma: PrismaClient): Promise<void> {
  const provinces = await prisma.nepalGeography.findMany({
    where: { type: 'PROVINCE', parentId: null },
    select: { id: true, nameEn: true },
  });
  const byName = new Map<string, { id: string; nameEn: string }[]>();
  for (const p of provinces) {
    const arr = byName.get(p.nameEn) ?? [];
    arr.push(p);
    byName.set(p.nameEn, arr);
  }

  for (const [, rows] of byName) {
    if (rows.length <= 1) continue;

    const rowsWithCounts = await Promise.all(
      rows.map(async (r) => ({
        ...r,
        districtCount: await prisma.nepalGeography.count({
          where: { type: 'DISTRICT', parentId: r.id },
        }),
      }))
    );
    rowsWithCounts.sort((a, b) => {
      if (b.districtCount !== a.districtCount) return b.districtCount - a.districtCount;
      return a.id.localeCompare(b.id);
    });
    const keep = rowsWithCounts[0];

    for (const drop of rowsWithCounts.slice(1)) {
      const districts = await prisma.nepalGeography.findMany({
        where: { type: 'DISTRICT', parentId: drop.id },
        select: { id: true, nameEn: true },
      });
      for (const d of districts) {
        const twinUnderKeep = await prisma.nepalGeography.findFirst({
          where: { type: 'DISTRICT', parentId: keep.id, nameEn: d.nameEn },
          select: { id: true },
        });
        if (twinUnderKeep) {
          await prisma.user.updateMany({
            where: { placeOfBirthDistrictId: d.id },
            data: { placeOfBirthDistrictId: twinUnderKeep.id },
          });
          await prisma.clientProfile.updateMany({
            where: { placeOfBirthDistrictId: d.id },
            data: { placeOfBirthDistrictId: twinUnderKeep.id },
          });
          await prisma.nepalGeography.delete({ where: { id: d.id } });
        } else {
          await prisma.nepalGeography.update({
            where: { id: d.id },
            data: { parentId: keep.id },
          });
        }
      }
      await prisma.user.updateMany({
        where: { placeOfBirthPradeshId: drop.id },
        data: { placeOfBirthPradeshId: keep.id },
      });
      await prisma.clientProfile.updateMany({
        where: { placeOfBirthPradeshId: drop.id },
        data: { placeOfBirthPradeshId: keep.id },
      });
      await prisma.nepalGeography.delete({ where: { id: drop.id } });
    }
    console.log(`🔧 Deduped ${rows.length - 1} duplicate province row(s) for "${keep.nameEn}"`);
  }
}

export async function seedNepalProvincesDistricts(prisma: PrismaClient): Promise<void> {
  if (!('nepalGeography' in prisma)) {
    console.log('⏭️  NepalGeography model not found, skipping geography seed');
    return;
  }

  await dedupeDuplicateProvinces(prisma);

  for (const { provinceNameEn, districtsEn } of PROVINCES_DISTRICTS) {
    let province = await prisma.nepalGeography.findFirst({
      where: { nameEn: provinceNameEn, type: 'PROVINCE', parentId: null },
      orderBy: { id: 'asc' },
    });
    if (!province) {
      try {
        province = await prisma.nepalGeography.create({
          data: {
            nameEn: provinceNameEn,
            type: 'PROVINCE',
            parentId: null,
          },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          province = await prisma.nepalGeography.findFirst({
            where: { nameEn: provinceNameEn, type: 'PROVINCE', parentId: null },
            orderBy: { id: 'asc' },
          });
        } else {
          throw e;
        }
      }
      if (!province) {
        throw new Error(`Failed to resolve province "${provinceNameEn}" after create conflict`);
      }
    }

    for (const districtNameEn of districtsEn) {
      const existing = await prisma.nepalGeography.findFirst({
        where: { nameEn: districtNameEn, type: 'DISTRICT', parentId: province.id },
      });
      if (!existing) {
        try {
          await prisma.nepalGeography.create({
            data: {
              nameEn: districtNameEn,
              type: 'DISTRICT',
              parentId: province.id,
            },
          });
        } catch (e) {
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            // Another concurrent seed or duplicate row; skip
          } else {
            throw e;
          }
        }
      }
    }
    console.log(`✅ Nepal province "${provinceNameEn}" with ${districtsEn.length} districts`);
  }
}
