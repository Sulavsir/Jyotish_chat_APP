import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Default password for new admins
  const defaultPassword = 'Nepal@123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

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
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
