import { PrismaClient } from '@prisma/client';
import { seedQuestions } from './seed-data.ts';

const prisma = new PrismaClient();

async function main() {
  for (const question of seedQuestions) {
    await prisma.question.upsert({
      where: { slug: question.slug },
      update: {
        prompt: question.prompt,
        mode: question.mode,
        pack: question.pack,
        difficulty: question.difficulty,
        tags: JSON.stringify(question.tags),
        competencies: JSON.stringify(question.competencies),
        timeLimitSec: question.timeLimitSec,
      },
      create: {
        ...question,
        tags: JSON.stringify(question.tags),
        competencies: JSON.stringify(question.competencies),
      },
    });
  }
}

main()
  .catch((error) => {
    console.error('Seed error', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
