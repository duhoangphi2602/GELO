import { PrismaClient, UserRole, Gender } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn('Cloudinary env vars are missing. Skipping Cloudinary cleanup.');
    return;
  }

  console.log('Cleaning Cloudinary assets under gelo/scans...');
  try {
    await cloudinary.api.delete_resources_by_prefix('gelo/scans', {
      resource_type: 'image',
      invalidate: true,
    });
    await cloudinary.api.delete_folder('gelo/scans').catch(() => {
      // ignore if folder does not exist or deletion is not supported
    });
    console.log('Cloudinary cleanup finished.');
  } catch (error: unknown) {
    const err = error as Error;
    console.warn(`Cloudinary cleanup failed: ${err.message}`);
  }
}

async function deleteAllData() {
  const deleteTable = async (model: any, name: string) => {
    try {
      await model.deleteMany();
      console.log(`Deleted all records from ${name}`);
    } catch (error: unknown) {
      const err = error as Error;
      console.warn(`Could not delete data from ${name}: ${err.message}`);
    }
  };

  await deleteTable(prisma.otpCode, 'OtpCode');
  await deleteTable(prisma.prediction, 'Prediction');
  await deleteTable(prisma.feedbackLog, 'FeedbackLog');
  await deleteTable(prisma.scanImage, 'ScanImage');
  await deleteTable(prisma.diagnosisResult, 'DiagnosisResult');
  await deleteTable(prisma.skinDiary, 'SkinDiary');
  await deleteTable(prisma.skinScan, 'SkinScan');
  await deleteTable(prisma.diseaseAdvice, 'DiseaseAdvice');
  await deleteTable(prisma.diseaseImage, 'DiseaseImage');
  await deleteTable(prisma.disease, 'Disease');
  await deleteTable(prisma.patient, 'Patient');
  await deleteTable(prisma.account, 'Account');
}

async function createDemoUsers() {
  console.log('Creating demo accounts...');
  const bcrypt = await import('bcrypt');

  const adminPasswordHash = await bcrypt.hash('password123', 10);
  await prisma.account.create({
    data: {
      username: 'admin',
      email: 'admin@healthai.com',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      isVerified: true,
    },
  });

  const patientPasswordHash = await bcrypt.hash('patient123', 10);
  await prisma.account.create({
    data: {
      username: 'patient',
      email: 'patient@healthai.com',
      passwordHash: patientPasswordHash,
      role: UserRole.PATIENT,
      isVerified: true,
      patient: {
        create: {
          fullName: 'Demo Patient',
          age: 30,
          gender: Gender.OTHER,
        },
      },
    },
  });
}

async function main() {
  console.log('--- 🚀 STARTING RESET SEED ---');
  await clearCloudinary();
  await deleteAllData();
  await createDemoUsers();
  console.log('✅ RESET SEED COMPLETE');
  console.log('   - Admin:   admin / password123');
  console.log('   - Patient: patient / patient123');
}

main()
  .catch((error: unknown) => {
    const err = error as Error;
    console.error(err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
