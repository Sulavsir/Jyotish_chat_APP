import { AdminRole, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedNepaliDates } from './seed_nepali_from_xlsx';
import { seedNepalProvincesDistricts } from './seed_nepal_provinces_districts';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  await seedNepaliDates(prisma);
  await seedNepalProvincesDistricts(prisma);

  // Default password for new admins
  const defaultPassword = 'Nepal@123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Users-only admin (no transactions / financial routes) — runs before other admin upserts
  const supportEmail = 'admin@jyotish.com';
  const supportPasswordPlain = 'Admin@12345';
  const supportHash = await bcrypt.hash(supportPasswordPlain, 10);
  const supportAdmin = await prisma.admin.upsert({
    where: { email: supportEmail },
    update: {
      password: supportHash,
      adminRole: AdminRole.USER_SUPPORT,
      name: 'Admin (Support)',
      isActive: true,
    },
    create: {
      email: supportEmail,
      password: supportHash,
      name: 'Admin (Support)',
      adminRole: AdminRole.USER_SUPPORT,
    },
  });
  console.log('✅ Support admin (USER_SUPPORT):', supportAdmin.email);
  console.log('   Login password:', supportPasswordPlain);

  const admins = [
    {
      email: 'pawankostyle@gmail.com',
      password: hashedPassword,
      name: 'Pawan Admin',
    },
    {
      email: 'emailhariharadhikari@gmail.com',
      password: hashedPassword,
      name: 'Harihar Admin',
    },
    {
      email: '',
      password: hashedPassword,
      name: 'Harihar Admin',
    },
    {
      email: 'emailhariharadhikari@gmail.com',
      password: hashedPassword,
      name: 'Harihar Admin',
    },
  ];

  for (const admin of admins) {
    const result = await prisma.admin.upsert({
      where: { email: admin.email },
      update: {},
      create: admin,
    });

    console.log('✅ Admin seeded:', result.email);
  }

  console.log('\n🔑 Default password for new admins:', defaultPassword);
  console.log('⚠️  IMPORTANT: Change passwords after first login!');

  // Password required for admin to edit/delete astrologers (stored hashed)
  const astrologerEditPassword = await bcrypt.hash('Nepal@123', 10);
  await prisma.settings.upsert({
    where: { key: 'astrologer_edit_password' },
    update: { value: astrologerEditPassword },
    create: {
      key: 'astrologer_edit_password',
      value: astrologerEditPassword,
      description: 'Password required for admin-side edits/deletes on astrologers',
    },
  });
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Astrologer edit password setting seeded (key: astrologer_edit_password)');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
