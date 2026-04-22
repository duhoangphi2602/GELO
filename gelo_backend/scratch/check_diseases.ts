import { PrismaClient } from '@prisma/client';

async function checkDiseases() {
  const prisma = new PrismaClient();
  try {
    const diseases = await prisma.disease.findMany();
    console.log('Diseases in DB:');
    console.log(JSON.stringify(diseases, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDiseases();
