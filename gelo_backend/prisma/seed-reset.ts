import { PrismaClient, UserRole, Gender, DiagnosticStatus, ImageQuality } from '@prisma/client';
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
  const patientAccount = await prisma.account.create({
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
    select: {
      patient: {
        select: { id: true },
      },
    },
  });

  if (!patientAccount.patient) {
    throw new Error('Failed to create demo patient account.');
  }

  return patientAccount.patient.id;
}

async function createDemoDiseasesAndAdvices() {
  console.log('Creating diseases and advice content...');

  const atopicDermatitis = await prisma.disease.create({
    data: {
      code: 'L20.9',
      name: 'Atopic Dermatitis',
      description:
        'A type of eczema causing itchy, dry, and inflamed skin patches. Source: Mayo Clinic.',
    },
  });

  const vascularTumor = await prisma.disease.create({
    data: {
      code: 'D18.0',
      name: 'Vascular Tumor',
      description:
        'A benign blood vessel growth such as a hemangioma, appearing as red or purple raised lesions. Source: Mayo Clinic.',
    },
  });

  const melanoma = await prisma.disease.create({
    data: {
      code: 'C43',
      name: 'Melanoma',
      description:
        'A serious type of skin cancer that may develop from moles or pigmented lesions. Source: Mayo Clinic.',
    },
  });

  const bullousDisease = await prisma.disease.create({
    data: {
      code: 'L10',
      name: 'Bullous Disease',
      description:
        'An autoimmune condition that causes large, fluid-filled blisters on the skin and mucous membranes. Source: Mayo Clinic.',
    },
  });

  const adviceItems = [
    {
      diseaseId: atopicDermatitis.id,
      adviceType: 'care',
      title: 'Moisturize Regularly',
      content:
        'Apply a fragrance-free moisturizer at least twice daily, especially after bathing, to restore the skin barrier. Source: Mayo Clinic.',
    },
    {
      diseaseId: atopicDermatitis.id,
      adviceType: 'care',
      title: 'Use Gentle Cleansers',
      content:
        'Use soap-free, low-irritant cleansers and avoid scrubbing affected skin. Source: Mayo Clinic.',
    },
    {
      diseaseId: atopicDermatitis.id,
      adviceType: 'lifestyle',
      title: 'Wear Soft, Breathable Fabrics',
      content:
        'Choose loose-fitting cotton clothing and avoid rough materials like wool. Source: Mayo Clinic.',
    },
    {
      diseaseId: atopicDermatitis.id,
      adviceType: 'emergency',
      title: 'Watch for Signs of Infection',
      content:
        'Seek care if redness spreads, yellow crust forms, or fever develops. Source: Mayo Clinic.',
    },
    {
      diseaseId: vascularTumor.id,
      adviceType: 'care',
      title: 'Protect the Vascular Lesion',
      content:
        'Avoid trauma to the lesion and keep the area clean. Source: Mayo Clinic.',
    },
    {
      diseaseId: vascularTumor.id,
      adviceType: 'lifestyle',
      title: 'Monitor Lesion Changes',
      content:
        'Track size, color, and shape over time and report sudden changes. Source: Mayo Clinic.',
    },
    {
      diseaseId: vascularTumor.id,
      adviceType: 'emergency',
      title: 'Seek Care for Bleeding or Pain',
      content:
        'If the lesion bleeds heavily, becomes painful, or changes rapidly, seek a clinician’s evaluation. Source: Mayo Clinic.',
    },
    {
      diseaseId: melanoma.id,
      adviceType: 'care',
      title: 'Use Broad-Spectrum Sunscreen',
      content:
        'Apply broad-spectrum sunscreen SPF 30+ daily and wear protective clothing outdoors. Source: Mayo Clinic.',
    },
    {
      diseaseId: melanoma.id,
      adviceType: 'lifestyle',
      title: 'Perform Monthly Skin Checks',
      content:
        'Inspect your skin monthly using the ABCDE rule: Asymmetry, Border, Color, Diameter, Evolving. Source: Mayo Clinic.',
    },
    {
      diseaseId: melanoma.id,
      adviceType: 'emergency',
      title: 'See a Dermatologist Quickly',
      content:
        'If a mole changes shape, color, bleeds, or becomes painful, see a dermatologist right away. Source: Mayo Clinic.',
    },
    {
      diseaseId: bullousDisease.id,
      adviceType: 'care',
      title: 'Handle Blisters Gently',
      content:
        'Clean blisters gently with mild soap and water and cover with non-stick dressings. Source: Mayo Clinic.',
    },
    {
      diseaseId: bullousDisease.id,
      adviceType: 'lifestyle',
      title: 'Reduce Skin Friction',
      content:
        'Wear soft, loose clothing and avoid pressure or rubbing on blistered areas. Source: Mayo Clinic.',
    },
    {
      diseaseId: bullousDisease.id,
      adviceType: 'emergency',
      title: 'Seek Urgent Care for Rapid Spread',
      content:
        'If blisters spread quickly, involve the mouth, or you develop fever, seek urgent medical attention. Source: Mayo Clinic.',
    },
  ];

  await prisma.diseaseAdvice.createMany({ data: adviceItems });

  return { atopicDermatitis, vascularTumor, melanoma, bullousDisease };
}

async function createDemoScanHistory(patientId: number, diseases: any) {
  console.log('Creating sample scan history...');

  const clearScan = await prisma.skinScan.create({
    data: {
      patientId,
      imageQuality: ImageQuality.CLEAR,
      images: {
        create: [
          {
            imageUrl:
              'https://images.unsplash.com/photo-1591717420969-6f7f3e504541?auto=format&fit=crop&w=900&q=80',
          },
        ],
      },
    },
  });

  await prisma.prediction.create({
    data: {
      scanId: clearScan.id,
      diseaseId: diseases.atopicDermatitis.id,
      confidence: 92,
      modelVersion: 'v1',
      diagnosticStatus: DiagnosticStatus.DISEASE,
    },
  });

  await prisma.diagnosisResult.create({
    data: {
      scanId: clearScan.id,
      predictedDiseaseId: diseases.atopicDermatitis.id,
      finalDiseaseId: diseases.atopicDermatitis.id,
      diagnosticStatus: DiagnosticStatus.DISEASE,
      decision: 'high_confidence',
      aiConfidence: 92,
    },
  });

  await prisma.diseaseImage.create({
    data: {
      diseaseId: diseases.atopicDermatitis.id,
      scanId: clearScan.id,
      imageUrl:
        'https://images.unsplash.com/photo-1533872909506-3476c5000b41?auto=format&fit=crop&w=900&q=80',
    },
  });

  const healthyScan = await prisma.skinScan.create({
    data: {
      patientId,
      imageQuality: ImageQuality.CLEAR,
      images: {
        create: [
          {
            imageUrl:
              'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
          },
        ],
      },
    },
  });

  await prisma.prediction.create({
    data: {
      scanId: healthyScan.id,
      confidence: 96,
      modelVersion: 'v1',
      diagnosticStatus: DiagnosticStatus.HEALTHY,
    },
  });

  await prisma.diagnosisResult.create({
    data: {
      scanId: healthyScan.id,
      predictedDiseaseId: null,
      finalDiseaseId: null,
      diagnosticStatus: DiagnosticStatus.HEALTHY,
      decision: 'high_confidence',
      aiConfidence: 96,
    },
  });

  return { clearScan, healthyScan };
}

async function createDemoDiaryEntries(patientId: number, scans: any) {
  console.log('Creating patient diary entries...');

  await prisma.skinDiary.create({
    data: {
      patientId,
      scanId: scans.clearScan.id,
      conditionScore: 7,
      symptoms: ['redness', 'itching', 'dry patches'],
      note:
        'Skin feels dry and itchy around the elbows. Applied a fragrance-free moisturizer twice daily.',
    },
  });

  await prisma.skinDiary.create({
    data: {
      patientId,
      scanId: scans.healthyScan.id,
      conditionScore: 2,
      symptoms: ['minor sensitivity'],
      note:
        'No major issues after using the new gentle cleanser. Skin feels calm and hydrated.',
    },
  });
}

async function main() {
  console.log('--- 🚀 STARTING RESET SEED ---');
  await clearCloudinary();
  await deleteAllData();

  const patientId = await createDemoUsers();
  const diseases = await createDemoDiseasesAndAdvices();
  const scans = await createDemoScanHistory(patientId, diseases);
  await createDemoDiaryEntries(patientId, scans);

  console.log('✅ RESET SEED COMPLETE');
  console.log('   - Admin:   admin / password123');
  console.log('   - Patient: patient / patient123');
  console.log(
    `   - Demo diseases: ${[
      diseases.atopicDermatitis,
      diseases.vascularTumor,
      diseases.melanoma,
      diseases.bullousDisease,
    ]
      .map((d) => d.name)
      .join(', ')}`,
  );
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
