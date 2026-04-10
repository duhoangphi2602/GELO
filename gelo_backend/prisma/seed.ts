import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Admin
  const adminPasswordHash = await bcrypt.hash('password123', 10);
  const adminAccount = await prisma.account.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@healthai.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
    },
  });
  console.log('Admin account created: admin / password123');

  // Create Patient Mock
  const patientPasswordHash = await bcrypt.hash('patient123', 10);
  const patientAccount = await prisma.account.upsert({
    where: { username: 'patient' },
    update: {},
    create: {
      username: 'patient',
      email: 'patient@healthai.com',
      passwordHash: patientPasswordHash,
      role: 'patient',
      patient: {
        create: {
          fullName: 'Demo Patient',
          age: 30,
          gender: 'Other',
        }
      }
    },
  });
  console.log('✅ Patient account created: patient / patient123');

  // Create Atopic Dermatitis
  await prisma.disease.create({
    data: {
      id: 1,
      name: 'Atopic Dermatitis',
      description: 'A chronic condition that makes your skin red and itchy.',
      visualPattern: 'Red, dry, itchy patches',
      hasBlister: false,
      hasScaling: true,
      status: 'active',
    }
  });

  console.log('✅ Disease entries created');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
