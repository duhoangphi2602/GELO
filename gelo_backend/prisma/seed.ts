import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const questions = [
    { questionText: "Are you experiencing itching?", isActive: true },
    { questionText: "Is there any redness or discoloration?", isActive: true },
    { questionText: "Do you notice any swelling?", isActive: true },
    { questionText: "Are you experiencing pain or discomfort?", isActive: true },
    { questionText: "Is there any unusual discharge?", isActive: true },
  ];

  for (const q of questions) {
    const question = await prisma.diagnosticQuestion.create({
      data: q,
    });
    
    // Link to Atopic Dermatitis (id=1)
    await (prisma.diseaseRule as any).create({
      data: {
        diseaseId: 1,
        questionId: question.id,
        expectedAnswer: true,
        weight: 80,
        isActive: true,
      }
    });
  }

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
