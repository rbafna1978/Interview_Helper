import { prisma } from '@/lib/prisma';
import { QuestionBankClient } from '@/components/question-bank/QuestionBankClient';

type Props = {
  searchParams: Promise<{ mode?: string; difficulty?: string }>;
};

export default async function QuestionBankPage({ searchParams }: Props) {
  const params = await searchParams;
  const modeFilter = params.mode && params.mode !== 'all' ? params.mode : undefined;
  const difficultyFilter = params.difficulty && params.difficulty !== 'all' ? Number(params.difficulty) : undefined;

  const [questions, counts] = await Promise.all([
    prisma.question.findMany({
      where: {
        mode: modeFilter,
        difficulty: difficultyFilter,
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        prompt: true,
        mode: true,
        difficulty: true,
        timeLimitSec: true,
        tags: true,
        competencies: true,
        slug: true,
      },
    }),
    prisma.question.groupBy({
      by: ['mode'],
      _count: { _all: true },
    }),
  ]);

  const totals = counts.reduce(
    (acc, row) => {
      acc[row.mode] = row._count._all;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <QuestionBankClient
      questions={questions}
      totals={totals}
      totalCount={questions.length}
      activeMode={params.mode ?? 'all'}
      activeDifficulty={params.difficulty ?? 'all'}
    />
  );
}
