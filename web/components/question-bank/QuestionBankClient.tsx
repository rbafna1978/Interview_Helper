'use client';

import * as React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type QuestionItem = {
  id: string;
  prompt: string;
  mode: string;
  difficulty: number;
  timeLimitSec: number;
  tags: string | null;
  competencies: string | null;
  slug: string;
};

type QuestionBankClientProps = {
  questions: QuestionItem[];
  totals: Record<string, number>;
  totalCount: number;
  activeMode: string;
  activeDifficulty: string;
};

const modeOptions = [
  { id: 'all', label: 'All' },
  { id: 'behavioral', label: 'Behavioral' },
  { id: 'technical', label: 'Technical' },
  { id: 'system_design', label: 'System design' },
];

function parseList(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatMode(mode: string) {
  return mode.replaceAll('_', ' ');
}

function ActiveFilterSummary({ activeMode, activeDifficulty }: { activeMode: string; activeDifficulty: string }) {
  const filters: string[] = [];

  if (activeMode !== 'all') filters.push(`Mode: ${formatMode(activeMode)}`);
  if (activeDifficulty !== 'all') filters.push(`Difficulty: ${activeDifficulty}`);

  if (filters.length === 0) {
    return <p className="text-sm text-[color:var(--text-muted)]">No filters applied.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <span
          key={filter}
          className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[color:var(--text-muted)]"
        >
          {filter}
        </span>
      ))}
    </div>
  );
}

function FilterForm({ activeMode, activeDifficulty, compact = false }: { activeMode: string; activeDifficulty: string; compact?: boolean }) {
  return (
    <form action="/question-bank" method="get" className="grid gap-4">
      <label className="text-sm text-[color:var(--text)]">
        <span className="text-[11px] uppercase tracking-[0.3em] text-[color:var(--text-muted)]">Mode</span>
        <select
          name="mode"
          defaultValue={activeMode}
          className="mt-2 h-11 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-sm text-[color:var(--text)] focus:outline-none"
        >
          <option value="all">All</option>
          <option value="behavioral">Behavioral</option>
          <option value="technical">Technical</option>
          <option value="system_design">System design</option>
        </select>
      </label>
      <label className="text-sm text-[color:var(--text)]">
        <span className="text-[11px] uppercase tracking-[0.3em] text-[color:var(--text-muted)]">Difficulty</span>
        <select
          name="difficulty"
          defaultValue={activeDifficulty}
          className="mt-2 h-11 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-sm text-[color:var(--text)] focus:outline-none"
        >
          <option value="all">All</option>
          {[1, 2, 3, 4, 5].map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="submit" variant="primary" className="w-full">
          Apply filters
        </Button>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/question-bank?mode=all&difficulty=all">Clear filters</Link>
        </Button>
      </div>
      {compact && <p className="text-xs text-[color:var(--text-muted)]">Filters apply to the current question list only.</p>}
    </form>
  );
}

export function QuestionBankClient({ questions, totals, totalCount, activeMode, activeDifficulty }: QuestionBankClientProps) {
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    <PageContainer className="space-y-6 md:space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.38em] text-[color:var(--text-muted)]">Question bank</p>
        <h1 className="text-3xl font-semibold text-[color:var(--text)] md:text-4xl">Browse curated prompts</h1>
        <p className="text-sm text-[color:var(--text-muted)]">{totalCount} prompts available</p>
      </header>

      <div className="md:hidden">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3 shadow-[0_8px_24px_var(--shadow)]">
          <p className="text-sm font-medium text-[color:var(--text)]">Refine question list</p>
          <Button variant="secondary" onClick={() => setIsFiltersOpen(true)} className="px-4">
            Filters
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 md:p-4">
        <ActiveFilterSummary activeMode={activeMode} activeDifficulty={activeDifficulty} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {modeOptions.map((chip) => {
          const isActive = activeMode === chip.id;
          const count = chip.id === 'all' ? totalCount : totals[chip.id] ?? 0;
          return (
            <Link
              key={chip.id}
              href={`/question-bank?mode=${chip.id}&difficulty=${activeDifficulty}`}
              className={`shrink-0 rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.2em] transition ${
                isActive
                  ? 'border-[color:var(--accent)] bg-[color:var(--surface)] text-[color:var(--text)]'
                  : 'border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-muted)] hover:text-[color:var(--text)]'
              }`}
            >
              {chip.label} · {count}
            </Link>
          );
        })}
      </div>

      <div className="grid items-start gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="sticky top-[84px] hidden md:block">
          <Card className="space-y-4 p-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--text)]">Filters</h2>
              <p className="mt-1 text-xs text-[color:var(--text-muted)]">Adjust mode and difficulty.</p>
            </div>
            <FilterForm activeMode={activeMode} activeDifficulty={activeDifficulty} compact />
          </Card>
        </aside>

        <section>
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
                  <motion.div
                    key={question.id}
                    whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.995 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                  >
                    <Card className="p-5 md:p-6">
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <h2 className="text-base font-semibold leading-relaxed text-[color:var(--text)] md:text-lg">{question.prompt}</h2>
                        <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[color:var(--text-muted)]">
                          {formatMode(question.mode)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[color:var(--text-muted)]">
                        <span>Difficulty {question.difficulty}</span>
                        <span>•</span>
                        <span>{Math.round(question.timeLimitSec / 60)} min</span>
                      </div>
                      {chips.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {chips.map((chip) => (
                            <span
                              key={chip.key}
                              className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[color:var(--text-muted)]"
                            >
                              {chip.label}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-5 flex flex-wrap gap-3">
                        <Button asChild variant="secondary">
                          <Link href={`/question/${question.slug}`}>Practice this question</Link>
                        </Button>
                        <Button asChild variant="ghost">
                          <Link href={`/sessions/new?mode=${question.mode}`}>Start mode</Link>
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {isFiltersOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close filters"
              onClick={() => setIsFiltersOpen(false)}
              className="fixed inset-0 z-40 bg-black/45 md:hidden"
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-[0_-8px_28px_var(--shadow)] md:hidden"
              initial={shouldReduceMotion ? false : { y: 24, opacity: 0 }}
              animate={shouldReduceMotion ? undefined : { y: 0, opacity: 1 }}
              exit={shouldReduceMotion ? undefined : { y: 24, opacity: 0 }}
              transition={shouldReduceMotion ? undefined : { type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--text)]">Filters</h2>
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen(false)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--text-muted)]"
                >
                  <span className="sr-only">Close filters panel</span>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <FilterForm activeMode={activeMode} activeDifficulty={activeDifficulty} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
