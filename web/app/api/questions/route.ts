import { NextResponse } from 'next/server';
import type { Question } from '@prisma/client';
import { prisma } from '@/lib/prisma';

function parseList(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapQuestion(question: Question) {
  return {
    id: question.id,
    slug: question.slug,
    text: question.prompt,
    mode: question.mode as string,
    pack: question.pack,
    difficulty: question.difficulty,
    competencies: parseList(question.competencies),
    tags: parseList(question.tags),
    timeLimitSec: question.timeLimitSec,
    createdAt: question.createdAt,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const data = await prisma.question.findUnique({ where: { slug } });
      if (!data) {
        return NextResponse.json({ question: null }, { status: 404 });
      }
      return NextResponse.json({ question: mapQuestion(data) });
    }

    const data = await prisma.question.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ questions: data.map(mapQuestion) });
  } catch (error) {
    console.error('GET /api/questions failed', error);
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });
  }
}
