import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Prisma 7 initialization with adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- 🚀 STARTING MASTER SEED ---');

  // 1. Cleanup existing diagnostic data to ensure a fresh start
  console.log('Cleaning up old diagnostic data and resetting sequences...');
  
  // Use TRUNCATE with RESTART IDENTITY to ensure IDs start at 1
  // We use CASCADE to handle foreign keys
  await prisma.$executeRaw`TRUNCATE TABLE "DiseaseAdvice" RESTART IDENTITY CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "DiseaseRule" RESTART IDENTITY CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "DiagnosticQuestion" RESTART IDENTITY CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Disease" RESTART IDENTITY CASCADE;`;
  
  // 2. Create Admin and Patient (Upsert)
  const adminPasswordHash = await bcrypt.hash('password123', 10);
  await prisma.account.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@healthai.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
    },
  });

  const patientPasswordHash = await bcrypt.hash('patient123', 10);
  await prisma.account.upsert({
    where: { username: 'patient' },
    update: {},
    create: {
      username: 'patient',
      email: 'patient@healthai.com',
      passwordHash: patientPasswordHash,
      role: 'patient',
      patient: {
        create: { fullName: 'Demo Patient', age: 30, gender: 'Other' }
      }
    },
  });

  // 3. Define Diseases (Order strictly matches AI labels.json IDs 1, 2, 3, 4)
  console.log('Creating Diseases...');
  
  // ID 1
  const ad = await prisma.disease.create({
    data: {
      name: 'Atopic Dermatitis',
      description: 'A chronic skin condition characterized by dry, itchy, and inflamed skin. Often common in children but can occur at any age.',
    }
  });

  // ID 2
  const vt = await prisma.disease.create({
    data: {
      name: 'Vascular Tumors',
      description: 'Benign or malignant growths derived from blood vessels or lymphatic vessels, such as hemangiomas or vascular malformations.',
    }
  });

  // ID 3
  const mel = await prisma.disease.create({
    data: {
      name: 'Melanoma Skin Cancer / Nevi / Moles',
      description: 'A broad category including benign moles (nevi) and melanoma, a serious form of skin cancer that begins in melanocytes.',
    }
  });

  // ID 4
  const bul = await prisma.disease.create({
    data: {
      name: 'Bullous Disease',
      description: 'A group of rare autoimmune disorders that cause blistering of the skin and mucous membranes, such as pemphigus or bullous pemphigoid.',
    }
  });

  // 4. Define Questions & Rules
  console.log('Populating Questions & Rules...');
  
  const diseasesData = [
    {
      diseaseId: ad.id,
      questions: [
        { text: 'Is the affected skin area intensely itchy and dry?', weight: 25, isEmergency: false },
        { text: 'Does the itching frequently worsen during the night?', weight: 20, isEmergency: false },
        { text: 'Does the rash appear in skin folds (e.g., elbows, behind knees)?', weight: 30, isEmergency: false },
        { text: 'Do you have a personal or family history of allergies, asthma, or hay fever?', weight: 15, isEmergency: false },
        { text: 'Is there any yellowish crusting, oozing, or signs of skin infection?', weight: 10, isEmergency: true },
      ]
    },
    {
      diseaseId: vt.id,
      questions: [
        { text: 'Is the lesion or bump primarily red, purple, or blue in color?', weight: 30, isEmergency: false },
        { text: 'Has the lesion been present since birth or appeared shortly after?', weight: 20, isEmergency: false },
        { text: 'Does the area bleed easily if bumped or scratched?', weight: 25, isEmergency: false },
        { text: 'Does the lesion change in size or color when crying or straining?', weight: 15, isEmergency: false },
        { text: 'Is the lesion growing rapidly or causing pain and ulceration?', weight: 10, isEmergency: true },
      ]
    },
    {
      diseaseId: mel.id,
      questions: [
        { text: 'Is the shape of the mole asymmetrical (one half does not match the other)?', weight: 25, isEmergency: false },
        { text: 'Are the edges of the mole irregular, notched, or blurred?', weight: 20, isEmergency: false },
        { text: 'Does the mole contain multiple colors (tan, brown, black, red, or white)?', weight: 20, isEmergency: false },
        { text: 'Is the diameter of the mole larger than 6mm (approx. the size of a pencil eraser)?', weight: 15, isEmergency: false },
        { text: 'Has the mole recently changed in size, shape, color, or started to itch/bleed?', weight: 20, isEmergency: true },
      ]
    },
    {
      diseaseId: bul.id,
      questions: [
        { text: 'Are there fluid-filled blisters appearing on your skin?', weight: 30, isEmergency: false },
        { text: 'Do the blisters rupture easily, leaving painful raw areas or sores?', weight: 25, isEmergency: false },
        { text: 'Is your skin unusually fragile, peeling off easily when rubbed?', weight: 20, isEmergency: false },
        { text: 'Did the blisters appear suddenly across large areas of your body?', weight: 15, isEmergency: false },
        { text: 'Are you experiencing blisters inside your mouth or on mucous membranes?', weight: 10, isEmergency: true },
      ]
    }
  ];

  for (const group of diseasesData) {
    for (const item of group.questions) {
      const q = await prisma.diagnosticQuestion.create({
        data: { questionText: item.text, isEmergency: item.isEmergency }
      });
      await prisma.diseaseRule.create({
        data: { diseaseId: group.diseaseId, questionId: q.id, expectedAnswer: true, weight: item.weight }
      });
    }
  }

  // 5. Define Advices
  console.log('Populating Advices...');

  const advices = [
    // Atopic Dermatitis
    { diseaseId: ad.id, type: 'care', title: 'Moisturize Regularly', content: 'Apply a gentle, fragrance-free moisturizer at least twice daily, especially right after bathing.' },
    { diseaseId: ad.id, type: 'lifestyle', title: 'Breathable Clothing', content: 'Wear loose-fitting cotton clothing; avoid wool or rough synthetic fabrics.' },
    { diseaseId: ad.id, type: 'emergency', title: 'Signs of Infection', content: 'Seek attention if you see pus, yellow crusts, or spreading redness with fever.' },

    // Vascular Tumors
    { diseaseId: vt.id, type: 'care', title: 'Protect from Injury', content: 'Keep the area protected to prevent accidental scratching or trauma which may cause bleeding.' },
    { diseaseId: vt.id, type: 'lifestyle', title: 'Monitor Growth', content: 'Keep a photo log of the lesion to help your doctor track any changes in size or color.' },
    { diseaseId: vt.id, type: 'emergency', title: 'Uncontrolled Bleeding', content: 'If the lesion bleeds and does not stop with firm pressure after 10 minutes, seek medical help.' },

    // Melanoma
    { diseaseId: mel.id, type: 'care', title: 'Sun Protection', content: 'Use broad-spectrum sunscreen and wear protective clothing to prevent further UV damage.' },
    { diseaseId: mel.id, type: 'lifestyle', title: 'Regular Self-Exams', content: 'Check your skin monthly using the ABCDE guide and have a partner check hard-to-reach areas.' },
    { diseaseId: mel.id, type: 'emergency', title: 'Rapid Change', content: 'Any mole that rapidly changes, bleeds, or becomes painful requires an immediate specialist consult.' },

    // Bullous Disease
    { diseaseId: bul.id, type: 'care', title: 'Wound Care', content: 'Keep ruptured blisters clean and covered with non-adherent dressings to prevent infection.' },
    { diseaseId: bul.id, type: 'lifestyle', title: 'Soft Foods', content: 'If you have mouth blisters, stick to soft, cool foods and avoid spicy or acidic items.' },
    { diseaseId: bul.id, type: 'emergency', title: 'Extensive Blistering', content: 'Seek immediate care if blisters cover a large area or if you have difficulty swallowing or breathing.' },
  ];

  for (const a of advices) {
    await prisma.diseaseAdvice.create({
      data: {
        diseaseId: a.diseaseId,
        adviceType: a.type,
        title: a.title,
        content: a.content
      }
    });
  }

  console.log('✅ SEEDING COMPLETE!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
