import { PrismaClient, UserRole, Gender } from '@prisma/client';
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

  // 1. Cleanup existing data
  console.log('Cleaning up existing disease data...');
  await prisma.$executeRaw`TRUNCATE TABLE "DiseaseAdvice" RESTART IDENTITY CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "Disease" RESTART IDENTITY CASCADE;`;

  // 2. Create Admin account (no Patient profile)
  console.log('Creating admin account...');
  const adminPasswordHash = await bcrypt.hash('password123', 10);
  await prisma.account.upsert({
    where: { username: 'admin' },
    update: { passwordHash: adminPasswordHash },
    create: {
      username: 'admin',
      email: 'admin@healthai.com',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  // 3. Create Demo Patient account
  console.log('Creating demo patient account...');
  const patientPasswordHash = await bcrypt.hash('patient123', 10);
  await prisma.account.upsert({
    where: { username: 'patient' },
    update: { passwordHash: patientPasswordHash },
    create: {
      username: 'patient',
      email: 'patient@healthai.com',
      passwordHash: patientPasswordHash,
      role: UserRole.PATIENT,
      patient: {
        create: {
          fullName: 'Demo Patient',
          age: 30,
          gender: Gender.OTHER,
        },
      },
    },
  });

  // 4. Create Diseases — Order strictly matches AI model labels.json IDs (1, 2, 3, 4)
  console.log('Creating diseases...');

  // Disease ID 1
  const ad = await prisma.disease.create({
    data: {
      code: 'L20.9',
      name: 'Atopic Dermatitis',
      description:
        'A chronic inflammatory skin condition characterized by intense itching, dry skin, and recurring rashes. It often begins in childhood and may persist into adulthood. Commonly associated with allergies, asthma, and hay fever.',
    },
  });

  // Disease ID 2
  const vt = await prisma.disease.create({
    data: {
      code: 'D18.0',
      name: 'Vascular Tumors',
      description:
        'Benign or malignant growths arising from blood vessels or lymphatic vessels. Common types include hemangiomas, which often appear as bright red birthmarks, and vascular malformations. Most are harmless but should be monitored for changes.',
    },
  });

  // Disease ID 3
  const mel = await prisma.disease.create({
    data: {
      code: 'MEL_NEV_MOL',
      name: 'Melanoma Skin Cancer / Nevi / Moles',
      description:
        'A broad category covering benign moles (nevi) and melanoma, the most dangerous form of skin cancer. Melanoma develops in melanocytes, the cells that produce skin pigment. Early detection is critical for effective treatment.',
    },
  });

  // Disease ID 4
  const bul = await prisma.disease.create({
    data: {
      code: 'L10',
      name: 'Bullous Disease',
      description:
        'A group of rare autoimmune disorders that cause large, fluid-filled blisters (bullae) on the skin and mucous membranes. Types include bullous pemphigoid and pemphigus vulgaris. These conditions require prompt medical attention.',
    },
  });

  // 5. Create Advices for each disease
  console.log('Creating advices...');

  const advices = [
    // ── Atopic Dermatitis ──────────────────────────────────────────────────
    {
      diseaseId: ad.id,
      adviceType: 'care',
      title: 'Moisturize Regularly',
      content:
        'Apply a gentle, fragrance-free moisturizer at least twice daily, especially immediately after bathing to lock in moisture.',
    },
    {
      diseaseId: ad.id,
      adviceType: 'care',
      title: 'Avoid Triggers',
      content:
        'Identify and avoid your personal triggers such as certain soaps, detergents, dust mites, pet dander, or specific foods.',
    },
    {
      diseaseId: ad.id,
      adviceType: 'lifestyle',
      title: 'Wear Breathable Clothing',
      content:
        'Choose loose-fitting cotton fabrics. Avoid wool, rough synthetic materials, and tight clothing that can irritate sensitive skin.',
    },
    {
      diseaseId: ad.id,
      adviceType: 'lifestyle',
      title: 'Manage Stress',
      content:
        'Stress can worsen flare-ups. Practice relaxation techniques such as meditation, yoga, or deep breathing exercises.',
    },
    {
      diseaseId: ad.id,
      adviceType: 'emergency',
      title: 'Signs of Skin Infection',
      content:
        'Seek immediate medical attention if you notice yellowish crusting, oozing, spreading redness, or if you develop a fever — these are signs of a secondary bacterial infection.',
    },

    // ── Vascular Tumors ────────────────────────────────────────────────────
    {
      diseaseId: vt.id,
      adviceType: 'care',
      title: 'Protect from Injury',
      content:
        'Keep the lesion protected from accidental trauma or scratching. Use padding or bandages if the area is prone to bumping.',
    },
    {
      diseaseId: vt.id,
      adviceType: 'care',
      title: 'Sun Protection',
      content:
        'Apply broad-spectrum SPF 30+ sunscreen on and around the lesion when outdoors, as UV exposure can affect vascular lesions.',
    },
    {
      diseaseId: vt.id,
      adviceType: 'lifestyle',
      title: 'Monitor Growth',
      content:
        'Keep a monthly photo log of the lesion to help your doctor track any changes in size, color, or texture over time.',
    },
    {
      diseaseId: vt.id,
      adviceType: 'emergency',
      title: 'Uncontrolled Bleeding',
      content:
        'If the lesion bleeds and does not stop with firm, direct pressure applied for 10 minutes, or if it bleeds repeatedly, seek emergency medical care immediately.',
    },

    // ── Melanoma / Nevi ────────────────────────────────────────────────────
    {
      diseaseId: mel.id,
      adviceType: 'care',
      title: 'Sun Protection is Essential',
      content:
        'Use a broad-spectrum SPF 50+ sunscreen every day, reapply every 2 hours when outdoors, and wear protective clothing, hats, and UV-blocking sunglasses.',
    },
    {
      diseaseId: mel.id,
      adviceType: 'care',
      title: 'Avoid Tanning Beds',
      content:
        'Tanning beds emit UV radiation that significantly increases the risk of melanoma. Avoid them completely.',
    },
    {
      diseaseId: mel.id,
      adviceType: 'lifestyle',
      title: 'Monthly Self-Exams',
      content:
        'Check your entire skin surface monthly using the ABCDE guide (Asymmetry, Border, Color, Diameter, Evolving). Ask a partner to check hard-to-see areas.',
    },
    {
      diseaseId: mel.id,
      adviceType: 'lifestyle',
      title: 'Annual Dermatologist Exam',
      content:
        'Schedule a full-body skin exam with a dermatologist at least once a year, especially if you have a family history of skin cancer.',
    },
    {
      diseaseId: mel.id,
      adviceType: 'emergency',
      title: 'Rapidly Changing Mole',
      content:
        'See a dermatologist immediately if any mole or spot rapidly changes in size, shape, or color, begins to bleed without injury, or becomes persistently itchy or painful.',
    },

    // ── Bullous Disease ────────────────────────────────────────────────────
    {
      diseaseId: bul.id,
      adviceType: 'care',
      title: 'Gentle Wound Care',
      content:
        'Keep ruptured blisters clean by gently washing with mild soap and water. Cover with non-adherent, sterile dressings to prevent infection.',
    },
    {
      diseaseId: bul.id,
      adviceType: 'care',
      title: 'Avoid Pressure on Blisters',
      content:
        'Do not pop blisters intentionally. Wear loose, soft clothing and use cushioned footwear to minimize pressure and friction on affected areas.',
    },
    {
      diseaseId: bul.id,
      adviceType: 'lifestyle',
      title: 'Dietary Adjustments',
      content:
        'If you have mouth blisters, stick to soft, cool, non-acidic, and non-spicy foods. Smoothies, yogurt, and mashed foods are good options.',
    },
    {
      diseaseId: bul.id,
      adviceType: 'emergency',
      title: 'Extensive or Spreading Blisters',
      content:
        'Seek immediate emergency care if blisters suddenly cover a large area of your body, if you have difficulty swallowing or breathing, or if signs of severe infection appear (fever, pus, spreading redness).',
    },
  ];

  for (const a of advices) {
    await prisma.diseaseAdvice.create({
      data: {
        diseaseId: a.diseaseId,
        adviceType: a.adviceType,
        title: a.title,
        content: a.content,
      },
    });
  }

  console.log('✅ SEEDING COMPLETE!');
  console.log(`   - Admin:   admin / password123`);
  console.log(`   - Patient: patient / patient123`);
  console.log(`   - Diseases: ${[ad, vt, mel, bul].map((d) => `${d.id}. ${d.name}`).join(', ')}`);
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
