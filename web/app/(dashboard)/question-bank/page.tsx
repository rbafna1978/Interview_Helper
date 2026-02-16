import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { prisma } from '@/lib/prisma';

type Props = {
  searchParams: Promise<{ mode?: string; difficulty?: string }>;
};

function parseList(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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
  const totalCount = questions.length;
  const activeMode = params.mode ?? 'all';
  const activeDifficulty = params.difficulty ?? 'all';

  return (
    <PageContainer className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--text-muted)]">Question bank</p>
        <h1 className="text-3xl font-semibold text-[color:var(--text)]">Browse curated prompts</h1>
        <p className="text-sm text-[color:var(--text-muted)]">{totalCount} prompts available</p>
      </header>

      <div className="sticky top-[64px] z-20 -mx-4 border-y border-[color:var(--border)] bg-[color:var(--bg)]/95 px-4 py-4 backdrop-blur">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'behavioral', label: 'Behavioral' },
            { id: 'technical', label: 'Technical' },
            { id: 'system_design', label: 'System design' },
          ].map((chip) => {
            const isActive = activeMode === chip.id;
            const count = chip.id === 'all' ? totalCount : totals[chip.id] ?? 0;
            return (
              <Link
                key={chip.id}
                href={`/question-bank?mode=${chip.id}&difficulty=${activeDifficulty}`}
                className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.25em] transition ${
                  isActive
                    ? 'border-[color:var(--accent)] text-[color:var(--text)]'
                    : 'border-[color:var(--border)] text-[color:var(--text-muted)] hover:text-[color:var(--text)]'
                }`}
              >
                {chip.label} · {count}
              </Link>
            );
          })}
        </div>

        <form className="mt-4 grid gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 md:grid-cols-[1fr_1fr_auto]">
          <label className="text-sm text-[color:var(--text)]">
            <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">Mode</span>
            <select
              name="mode"
              defaultValue={params.mode ?? 'all'}
              className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text)] focus:outline-none"
            >
              <option value="all">All</option>
              <option value="behavioral">Behavioral</option>
              <option value="technical">Technical</option>
              <option value="system_design">System design</option>
            </select>
          </label>
          <label className="text-sm text-[color:var(--text)]">
            <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">Difficulty</span>
            <select
              name="difficulty"
              defaultValue={params.difficulty ?? 'all'}
              className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text)] focus:outline-none"
            >
              <option value="all">All</option>
              {[1, 2, 3, 4, 5].map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end justify-end gap-3">
            <Button type="submit" variant="primary" className="w-full md:w-auto">
              Apply filters
            </Button>
          </div>
        </form>
      </div>

      {questions.length === 0 ? (
        <Card>
          <p className="text-sm text-[color:var(--text-muted)]">No questions match those filters yet.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {questions.map((question) => {
            const tags = parseList(question.tags);
            const competencies = parseList(question.competencies);
            const chips = [...tags, ...competencies].slice(0, 6).map((chip, index) => ({
              label: chip,
              key: `${question.id}-${chip}-${index}`,
            }));
            return (
              <Card key={question.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="text-lg font-semibold text-[color:var(--text)]">{question.prompt}</h2>
                  <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-[color:var(--text-muted)]">
                    {question.mode}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[color:var(--text-muted)]">
                  <span>Difficulty {question.difficulty}</span>
                  <span>•</span>
                  <span>{Math.round(question.timeLimitSec / 60)} min</span>
                </div>
                {chips.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {chips.map((chip) => (
                      <span
                        key={chip.key}
                        className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs uppercase tracking-[0.25em] text-[color:var(--text-muted)]"
                      >
                        {chip.label}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button asChild variant="secondary">
                    <Link href={`/question/${question.slug}`}>Practice this question</Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href={`/sessions/new?mode=${question.mode}`}>Start mode</Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
