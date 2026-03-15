/**
 * Seed NepalGeography with English names for provinces and districts.
 * Province number is not stored; nameEn is used for display and selection.
 */

import type { PrismaClient } from '@prisma/client';

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
    districtsEn: ['Bara', 'Dhanusha', 'Mahottari', 'Parsa', 'Rautahat', 'Saptari', 'Sarlahi', 'Siraha'],
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
    districtsEn: ['Achham', 'Baitadi', 'Bajura', 'Dadeldhura', 'Darchula', 'Doti', 'Kailali', 'Kanchanpur'],
  },
];

export async function seedNepalProvincesDistricts(prisma: PrismaClient): Promise<void> {
  if (!('nepalGeography' in prisma)) {
    console.log('⏭️  NepalGeography model not found, skipping geography seed');
    return;
  }

  for (const { provinceNameEn, districtsEn } of PROVINCES_DISTRICTS) {
    let province = await prisma.nepalGeography.findFirst({
      where: { nameEn: provinceNameEn, type: 'PROVINCE', parentId: null },
    });
    if (!province) {
      province = await prisma.nepalGeography.create({
        data: {
          nameEn: provinceNameEn,
          type: 'PROVINCE',
          parentId: null,
        },
      });
    }

    for (const districtNameEn of districtsEn) {
      const existing = await prisma.nepalGeography.findFirst({
        where: { nameEn: districtNameEn, type: 'DISTRICT', parentId: province.id },
      });
      if (!existing) {
        await prisma.nepalGeography.create({
          data: {
            nameEn: districtNameEn,
            type: 'DISTRICT',
            parentId: province.id,
          },
        });
      }
    }
    console.log(`✅ Nepal province "${provinceNameEn}" with ${districtsEn.length} districts`);
  }
}
