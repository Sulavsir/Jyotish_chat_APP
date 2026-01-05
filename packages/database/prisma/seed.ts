import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default admin account
  const adminEmail = 'admin@jyotish.com';
  const adminPassword = 'Admin@123'; 

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'System Administrator',
    },
  });

  console.log('✅ Admin account created:');
  console.log('   📧 Email:', adminEmail);
  console.log('   🔑 Password:', adminPassword);
  console.log('   🆔 ID:', admin.id);
  console.log('\n⚠️  IMPORTANT: Change the admin password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


