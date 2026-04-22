import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const diseases = await prisma.disease.findMany();
  console.log(JSON.stringify(diseases, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
