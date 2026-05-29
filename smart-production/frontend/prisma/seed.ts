import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    'ADMIN',
    'MAIN_EMPLOYEE',
    'STORE_EMPLOYEE',
    'CUTTING_EMPLOYEE',
    'STITCHING_EMPLOYEE',
    'QUALITY_CHECK_EMPLOYEE',
    'PRESSING_EMPLOYEE',
    'PACKAGING_EMPLOYEE',
  ];
  const domains = ['enamels.com', 'smartpro.com'];

  const password = await bcrypt.hash('pass123', 10);

  console.log('Seeding users...');

  for (const domain of domains) {
    for (const role of roles) {
      const email = `${role.toLowerCase()}@${domain}`;
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          password,
          name: role.replace('_', ' '),
          role: role,
          employeeId: `EMP-${role.substring(0, 3)}-${domain.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
        },
      });
      console.log(`Seeded user: ${user.email}`);
    }
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
