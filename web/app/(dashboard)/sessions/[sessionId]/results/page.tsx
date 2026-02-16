import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fetchSessionById } from '@/lib/data/sessions';
import { prisma } from '@/lib/prisma';
import { EmptyState } from '@/components/ui/EmptyState';
import TranscriptHighlights from '@/components/results/TranscriptHighlights';
import { ScoreBreakdown } from '@/components/results/ScoreBreakdown';
import type { AttemptFeedback, ScoreIssue } from '@/lib/types';

type Props = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ slug?: string; attempt?: string }>;
};

type QuestionAlignment = {
  score?: number;
  strengths?: string[];
  missing_topics?: string[];
  suggestions?: string[];
};

type ExplainPayload = {
  weights?: Record<string, number>;
  signals?: Record<string, number | string>;
};

function normalizeIssue(value: unknown): ScoreIssue | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  const severity = obj.severity;
  const normalizedSeverity: ScoreIssue['severity'] =
    severity === 'low' || severity === 'medium' || severity === 'high' ? severity : 'medium';
  return {
    type: typeof obj.type === 'string' ? obj.type : 'issue',
    severity: normalizedSeverity,
    evidenceSnippet:
      typeof obj.evidenceSnippet === 'string'
        ? obj.evidenceSnippet
        : typeof obj.evidence === 'string'
          ? obj.evidence
          : '',
    fixSuggestion:
      typeof obj.fixSuggestion === 'string'
        ? obj.fixSuggestion
        : typeof obj.fix === 'string'
          ? obj.fix
          : 'Refine this section for clarity.',
  };
}

function safeJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Strong';
  if (score >= 65) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Needs work';
}

function scoreColorStyle(score: number): string {
  if (score >= 75) return '#16a34a';
  if (score >= 55) return '#d97706';
  return '#dc2626';
}

export default async function SessionResultsPage({ params, searchParams }: Props) {
  const { sessionId } = await params;
  const { slug, attempt: attemptId } = await searchParams;
  const session = await fetchSessionById(sessionId);
  if (!session) notFound();

  const question =
    (slug && (await prisma.question.findUnique({ where: { slug } }))) ||
    (await prisma.question.findFirst({ orderBy: { createdAt: 'asc' } }));

  const attempt = attemptId
    ? await prisma.attempt.findUnique({ where: { id: attemptId } })
    : await prisma.attempt.findFirst({
        where: {
          sessionId: session.id,
          ...(question?.id ? { questionId: question.id } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });

  const feedback = safeJson<Partial<AttemptFeedback> & { explain?: ExplainPayload; question_alignment?: QuestionAlignment }>(
    attempt?.feedbackJson,
    {}
  );
  const breakdown = safeJson<Record<string, number>>(attempt?.scoreBreakdownJson, {});
  const rawIssues = Array.isArray(feedback?.issues) ? feedback.issues : [];
  const issues = rawIssues
    .map((issue) => normalizeIssue(issue))
    .filter((issue): issue is ScoreIssue => Boolean(issue))
    .filter((issue) => issue.evidenceSnippet || issue.fixSuggestion);

  const subscores = feedback?.subscores ?? breakdown ?? {};
  const overallScore =
    typeof feedback?.overallScore === 'number'
      ? feedback.overallScore
      : typeof attempt?.scoreOverall === 'number'
        ? attempt.scoreOverall
        : 0;

  const scoreItems = [
    { key: 'structure', label: 'Structure', value: subscores.structure ?? subscores.structure_score ?? 0 },
    { key: 'relevance', label: 'Relevance', value: subscores.relevance ?? subscores.relevance_score ?? 0 },
    { key: 'clarity', label: 'Clarity', value: subscores.clarity ?? subscores.clarity_score ?? 0 },
    { key: 'conciseness', label: 'Conciseness', value: subscores.conciseness ?? subscores.concision ?? 0 },
    { key: 'delivery', label: 'Delivery', value: subscores.delivery ?? subscores.confidence ?? 0 },
    { key: 'technical', label: 'Technical', value: subscores.technical ?? subscores.content ?? 0 },
  ].filter((item) => typeof item.value === 'number');

  const explain = feedback?.explain ?? null;
  const questionAlignment = (feedback?.question_alignment ?? null) as QuestionAlignment | null;
  const signals = explain?.signals ?? {};
  const topFixes = Array.isArray(feedback?.suggestions)
    ? feedback.suggestions.slice(0, 3)
    : issues.slice(0, 3).map((i) => i.fixSuggestion);
  const strengths = Array.isArray(feedback?.strengths) ? feedback.strengths : [];
  const transcript = attempt?.transcript ?? feedback?.transcript ?? '';

  const compareAttempts = question?.id
    ? await prisma.attempt.findMany({
        where: { sessionId: session.id, questionId: question.id },
        orderBy: { createdAt: 'desc' },
        take: 2,
      })
    : [];

  const scoreColor = scoreColorStyle(overallScore);

  return (
    <PageContainer className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-serif text-3xl font-semibold text-[color:var(--text)]">Review your answer</h1>
        <p className="text-sm text-[color:var(--text-muted)]">
          {question?.prompt ?? 'Custom prompt'} — {new Date(attempt?.createdAt ?? Date.now()).toLocaleString()}
        </p>
      </header>

      {!attempt ? (
        <Card className="space-y-4">
          <p className="text-sm text-[color:var(--text-muted)]">No attempts found yet. Record an answer to see feedback.</p>
        </Card>
      ) : (
        <>
          {/* Score + fixes */}
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="space-y-4">
              <div className="flex items-end gap-4">
                <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white"
                  style={{ backgroundColor: scoreColor }}
                >
                  {Math.round(overallScore)}
                </div>
                <div>
                  <p className="text-sm text-[color:var(--text-muted)]">Overall score</p>
                  <p className="font-serif text-xl font-semibold" style={{ color: scoreColor }}>
                    {scoreLabel(overallScore)}
                  </p>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-[color:var(--surface-muted)]">
                <div className="h-2 rounded-full transition-all" style={{ width: `${overallScore}%`, backgroundColor: scoreColor }} />
              </div>

              {topFixes.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-sm font-medium text-[color:var(--text)]">Focus for next time</p>
                  <ul className="space-y-2">
                    {topFixes.map((fix: string, i: number) => (
                      <li key={`${fix}-${i}`} className="rounded-xl bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text)]">
                        {fix}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            <ScoreBreakdown scores={scoreItems} />
          </div>

          {/* Strengths */}
          {strengths.length > 0 && (
            <Card className="border-emerald-200 bg-emerald-50 space-y-3">
              <p className="text-sm font-medium text-emerald-700">What went well</p>
              <ul className="space-y-2">
                {strengths.slice(0, 4).map((item: string, i: number) => (
                  <li key={`${item}-${i}`} className="flex items-start gap-2 text-sm text-emerald-900">
                    <span className="mt-0.5 text-emerald-500">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Transcript */}
          <Card className="space-y-3">
            <p className="text-sm font-medium text-[color:var(--text)]">Transcript review</p>
            <TranscriptHighlights transcript={transcript} issues={issues} />
          </Card>

          {/* Relevance to prompt */}
          {questionAlignment && (
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[color:var(--text)]">Relevance to prompt</p>
                <span className="rounded-full bg-[color:var(--surface-muted)] px-3 py-1 text-xs text-[color:var(--text-muted)]">
                  {Math.round((questionAlignment.score ?? 0) * 100)}% match
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm">
                  <p className="mb-2 font-medium text-emerald-700">Covered</p>
                  <ul className="space-y-1">
                    {(questionAlignment.strengths ?? []).slice(0, 4).map((item: string, i: number) => (
                      <li key={`${item}-${i}`} className="text-[color:var(--text)]">{item}</li>
                    ))}
                    {(questionAlignment.strengths ?? []).length === 0 && (
                      <li className="text-[color:var(--text-muted)]">No rubric strengths detected yet.</li>
                    )}
                  </ul>
                </div>
                <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm">
                  <p className="mb-2 font-medium text-rose-700">Missing</p>
                  <ul className="space-y-1">
                    {(questionAlignment.missing_topics ?? []).slice(0, 4).map((item: string, i: number) => (
                      <li key={`${item}-${i}`} className="text-[color:var(--text)]">{item}</li>
                    ))}
                    {(questionAlignment.missing_topics ?? []).length === 0 && (
                      <li className="text-[color:var(--text-muted)]">All key topics were addressed.</li>
                    )}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {/* Answer quality checklist */}
          <Card className="space-y-3">
            <p className="text-sm font-medium text-[color:var(--text)]">Answer quality checklist</p>
            <div className="grid gap-2 text-sm text-[color:var(--text)] md:grid-cols-2">
              {[
                { label: 'STAR structure present', ok: (signals.starCoverage ?? 0) >= 3 },
                { label: 'Clear result or impact', ok: (signals.resultStrength ?? 0) >= 0.55 },
                { label: 'Low filler rate', ok: (signals.fillerRate ?? 0) <= 2.5 },
                { label: 'Balanced pace', ok: (signals.wpm ?? 0) >= 110 && (signals.wpm ?? 0) <= 175 },
                { label: 'Concise sentences', ok: (signals.avgSentenceLength ?? 0) <= 22 },
                { label: 'Low hedge rate', ok: (signals.hedgeRate ?? 0) <= 2.0 },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2.5">
                  <span>{item.label}</span>
                  <span className={`text-xs font-medium ${item.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {item.ok ? 'Pass' : 'Fix'}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Compare attempts */}
          {compareAttempts.length > 1 && (
            <Card className="space-y-3">
              <p className="text-sm font-medium text-[color:var(--text)]">Compare recent attempts</p>
              <div className="grid gap-3 md:grid-cols-2">
                {compareAttempts.map((entry, i) => {
                  const s = entry.scoreOverall ?? 0;
                  return (
                    <div key={entry.id} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm">
                      <p className="text-xs text-[color:var(--text-muted)]">{i === 0 ? 'Latest' : 'Previous'}</p>
                      <p className="mt-1 font-serif text-2xl font-semibold" style={{ color: scoreColorStyle(s) }}>{s}</p>
                      <p className="mt-1 text-xs text-[color:var(--text-muted)]">{new Date(entry.createdAt).toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Signal dashboard — collapsible */}
          {explain && (
            <details className="group">
              <summary className="cursor-pointer list-none">
                <Card className="flex items-center justify-between space-y-0 hover:border-[color:var(--accent)]/40">
                  <p className="text-sm font-medium text-[color:var(--text)]">How is this scored?</p>
                  <svg className="h-4 w-4 text-[color:var(--text-muted)] transition group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Card>
              </summary>
              <div className="mt-2 space-y-4 pl-1">
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { label: 'STAR coverage', value: `${Math.round((signals.starCoverage ?? 0) * 100)}%`, bar: (signals.starCoverage ?? 0) * 100, color: '#16a34a' },
                    { label: 'Result strength', value: `${Math.round((signals.resultStrength ?? 0) * 100)}%`, bar: (signals.resultStrength ?? 0) * 100, color: 'var(--accent-2)' },
                    { label: 'WPM', value: Math.round(signals.wpm ?? 0).toString(), bar: Math.min(100, ((signals.wpm ?? 0) / 170) * 100), color: '#d97706' },
                    { label: 'Filler rate', value: Number(signals.fillerRate ?? 0).toFixed(2), bar: Math.max(0, 100 - ((Number(signals.fillerRate ?? 0) / 6) * 100)), color: '#dc2626' },
                    { label: 'Hedge rate', value: Number(signals.hedgeRate ?? 0).toFixed(2), bar: Math.max(0, 100 - ((Number(signals.hedgeRate ?? 0) / 6) * 100)), color: '#dc2626' },
                    { label: 'Avg sentence length', value: Math.round(Number(signals.avgSentenceLength ?? 0)).toString(), bar: Math.max(0, 100 - Math.max(0, ((Number(signals.avgSentenceLength) - 8) / 18) * 100)), color: 'var(--accent-2)' },
                  ].map((sig) => (
                    <div key={sig.label} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                      <p className="text-xs text-[color:var(--text-muted)]">{sig.label}</p>
                      <p className="mt-1 font-serif text-xl font-semibold text-[color:var(--text)]">{sig.value}</p>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-[color:var(--surface)]">
                        <div className="h-1.5 rounded-full" style={{ width: `${Math.max(0, Math.min(100, sig.bar))}%`, backgroundColor: sig.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          )}
        </>
      )}

      <EmptyState
        title="Next steps"
        description="Try another question or return to your dashboard."
        action={
          <div className="flex gap-3">
            <Button asChild variant="secondary">
              <Link href={`/sessions/${session.id}/question${question ? `?slug=${question.slug}` : ''}`}>Next question</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        }
      />
    </PageContainer>
  );
}
