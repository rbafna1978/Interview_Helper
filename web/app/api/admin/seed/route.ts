import { NextResponse } from 'next/server';
import { seedQuestions } from '@/prisma/seed-data';
import { prisma } from '@/lib/prisma';

function isAuthorized(req: Request) {
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }
  const token = process.env.SEED_SECRET;
  if (!token) return false;
  const header = req.headers.get('authorization') ?? '';
  return header === `Bearer ${token}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

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

  return NextResponse.json({ ok: true, count: seedQuestions.length });
}
