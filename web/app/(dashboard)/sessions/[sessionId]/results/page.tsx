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

type Props = {
  params: { sessionId: string };
  searchParams: { slug?: string; attempt?: string };
};

function safeJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function buildRewriteSuggestion(issueType: string, evidence: string) {
  switch (issueType) {
    case 'missing_star':
      return `Rewrite using STAR: Situation (1 sentence), Task (1 sentence), Action (2 sentences), Result (1 sentence). Tie it back to: "${evidence || 'your prompt'}".`;
    case 'low_relevance':
      return `Rewrite by echoing the prompt keywords first, then connect your example to "${evidence || 'the prompt'}".`;
    case 'rambling':
      return `Rewrite in 2 sentences: Outcome first, then the 1–2 actions that caused it.`;
    case 'filler_heavy':
      return `Rewrite with clean pauses: "First, I … Then, I … Result: …".`;
    case 'technical_shallow':
      return `Rewrite with one concrete technical detail (tool, algorithm, trade-off) tied to "${evidence || 'the prompt'}".`;
    default:
      return `Rewrite in 3 short sentences: context, action, measurable outcome.`;
  }
}

function scaleSignal(value: number, min: number, max: number, invert = false) {
  if (Number.isNaN(value)) return 0;
  const clamped = Math.max(min, Math.min(value, max));
  const raw = ((clamped - min) / (max - min)) * 100;
  return invert ? 100 - raw : raw;
}

export default async function SessionResultsPage({ params, searchParams }: Props) {
  const session = await fetchSessionById(params.sessionId);
  if (!session) {
    notFound();
  }
  const question =
    (searchParams.slug && (await prisma.question.findUnique({ where: { slug: searchParams.slug } }))) ||
    (await prisma.question.findFirst({ orderBy: { createdAt: 'asc' } }));

  const attempt = searchParams.attempt
    ? await prisma.attempt.findUnique({ where: { id: searchParams.attempt } })
    : await prisma.attempt.findFirst({
        where: {
          sessionId: session.id,
          ...(question?.id ? { questionId: question.id } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });

  const feedback = safeJson<Record<string, any>>(attempt?.feedbackJson, {});
  const breakdown = safeJson<Record<string, number>>(attempt?.scoreBreakdownJson, {});
  const rawIssues = Array.isArray(feedback?.issues) ? feedback.issues : [];
  const issues = rawIssues
    .map((issue: any) => ({
      type: issue?.type ?? 'issue',
      severity: issue?.severity ?? 'medium',
      evidenceSnippet: issue?.evidenceSnippet ?? issue?.evidence ?? '',
      fixSuggestion: issue?.fixSuggestion ?? issue?.fix ?? 'Refine this section for clarity.',
      rewriteSuggestion: buildRewriteSuggestion(issue?.type ?? 'issue', issue?.evidenceSnippet ?? issue?.evidence ?? ''),
    }))
    .filter((issue: any) => issue.evidenceSnippet || issue.fixSuggestion);
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
  const questionAlignment = feedback?.question_alignment ?? feedback?.questionAlignment ?? null;
  const signals = explain?.signals ?? {};
  const topFixes = Array.isArray(feedback?.suggestions)
    ? feedback.suggestions.slice(0, 3)
    : issues.slice(0, 3).map((issue: any) => issue.fixSuggestion);
  const rewriteSuggestions = issues
    .map((issue: any) => issue.rewriteSuggestion)
    .filter(Boolean)
    .slice(0, 3);
  const strengths = Array.isArray(feedback?.strengths) ? feedback.strengths : [];

  const transcript = attempt?.transcript ?? feedback?.transcript ?? '';

  const compareAttempts = question?.id
    ? await prisma.attempt.findMany({
        where: { sessionId: session.id, questionId: question.id },
        orderBy: { createdAt: 'desc' },
        take: 2,
      })
    : [];

  return (
    <PageContainer className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--text-muted)]">Session results</p>
        <h1 className="text-3xl font-semibold text-[color:var(--text)]">Review feedback</h1>
        <p className="text-sm text-[color:var(--text-muted)]">
          Free • Local-first • Private. Review the rubric output and apply fixes in your next response.
        </p>
      </header>

      {!attempt ? (
        <Card className="space-y-4">
          <p className="text-sm text-[color:var(--text-muted)]">Status</p>
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text-muted)]">
            No attempts found yet. Record an answer to see rubric feedback.
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--text-muted)]">Overall score</p>
            <div className="flex items-end gap-4">
              <span className="text-5xl font-semibold text-[color:var(--text)]">{Math.round(overallScore)}</span>
              <span className="text-sm text-[color:var(--text-muted)]">/ 100</span>
            </div>
            <p className="text-sm text-[color:var(--text-muted)]">
              Based on structure, relevance, clarity, conciseness, delivery, and technical reasoning.
            </p>
            {topFixes.length > 0 && (
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text)]">
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">Top fixes for next time</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-[color:var(--text)]">
                  {topFixes.map((fix: string, index: number) => (
                    <li key={`${fix}-${index}`}>{fix}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <ScoreBreakdown scores={scoreItems} />
        </div>
      )}

      {attempt && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="space-y-3">
            <p className="text-sm text-[color:var(--text-muted)]">Attempt details</p>
            <div className="space-y-2 text-sm text-[color:var(--text)]">
              <div className="flex items-center justify-between">
                <span className="text-[color:var(--text-muted)]">Question</span>
                <span className="text-right text-[color:var(--text)]">{question?.prompt ?? 'Custom prompt'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[color:var(--text-muted)]">Mode</span>
                <span className="text-right text-[color:var(--text)]">{session.mode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[color:var(--text-muted)]">Recorded</span>
                <span className="text-right text-[color:var(--text)]">{new Date(attempt.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[color:var(--text-muted)]">Status</span>
                <span className="text-right text-[color:var(--text)]">{attempt.status}</span>
              </div>
            </div>
          </Card>

          <Card className="space-y-3">
            <p className="text-sm text-[color:var(--text-muted)]">Coach highlights</p>
            {strengths.length > 0 ? (
              <ul className="list-disc space-y-2 pl-5 text-sm text-[color:var(--text)]">
                {strengths.slice(0, 4).map((item: string, index: number) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[color:var(--text-muted)]">
                Keep practicing—strength highlights appear as soon as the model detects them.
              </p>
            )}
          </Card>
        </div>
      )}

      {attempt && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[color:var(--text-muted)]">Transcript review</p>
            <span className="text-xs text-[color:var(--text-muted)]">{attempt.status}</span>
          </div>
          <TranscriptHighlights transcript={transcript} issues={issues} />
        </Card>
      )}

      {attempt && rewriteSuggestions.length > 0 && (
        <Card className="space-y-3">
          <p className="text-sm text-[color:var(--text-muted)]">Rewrite suggestions</p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[color:var(--text)]">
            {rewriteSuggestions.map((rewrite: string, index: number) => (
              <li key={`${rewrite}-${index}`}>{rewrite}</li>
            ))}
          </ul>
        </Card>
      )}

      {attempt && questionAlignment && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[color:var(--text-muted)]">Relevance to prompt</p>
            <span className="text-xs text-[color:var(--text-muted)]">
              {Math.round((questionAlignment.score ?? 0) * 100)}% match
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text)]">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">Covered</p>
              <ul className="mt-3 space-y-2">
                {(questionAlignment.strengths ?? []).slice(0, 4).map((item: string, index: number) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
                {(questionAlignment.strengths ?? []).length === 0 && (
                  <li className="text-[color:var(--text-muted)]">No rubric strengths detected yet.</li>
                )}
              </ul>
            </div>
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text)]">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">Missing</p>
              <ul className="mt-3 space-y-2">
                {(questionAlignment.missing_topics ?? []).slice(0, 4).map((item: string, index: number) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
                {(questionAlignment.missing_topics ?? []).length === 0 && (
                  <li className="text-[color:var(--text-muted)]">All key rubric topics were addressed.</li>
                )}
              </ul>
            </div>
          </div>
          {(questionAlignment.suggestions ?? []).length > 0 && (
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text)]">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">Relevance fixes</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                {(questionAlignment.suggestions ?? []).slice(0, 3).map((item: string, index: number) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {attempt && (
        <Card className="space-y-3">
          <p className="text-sm text-[color:var(--text-muted)]">Answer quality checklist</p>
          <div className="grid gap-3 text-sm text-[color:var(--text)] md:grid-cols-2">
            {[
              { label: 'STAR structure present', ok: (signals.starCoverage ?? 0) >= 3 },
              { label: 'Clear result or impact', ok: (signals.resultStrength ?? 0) >= 0.55 },
              { label: 'Low filler rate', ok: (signals.fillerRate ?? 0) <= 2.5 },
              { label: 'Balanced pace', ok: (signals.wpm ?? 0) >= 110 && (signals.wpm ?? 0) <= 175 },
              { label: 'Concise sentences', ok: (signals.avgSentenceLength ?? 0) <= 22 },
              { label: 'Low hedge rate', ok: (signals.hedgeRate ?? 0) <= 2.0 },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2">
                <span>{item.label}</span>
                <span className={`text-xs uppercase tracking-[0.3em] ${item.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {item.ok ? 'Pass' : 'Fix'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {attempt && explain && (
        <Card className="space-y-3">
          <p className="text-sm text-[color:var(--text-muted)]">Explain my score</p>
          <div className="grid gap-3 text-xs text-[color:var(--text-muted)] md:grid-cols-2">
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">Weights</p>
              <ul className="mt-3 space-y-2">
                {Object.entries(explain.weights ?? {}).map(([key, value]) => (
                  <li key={key} className="flex items-center justify-between">
                    <span className="capitalize">{key}</span>
                    <span className="font-mono text-[color:var(--text)]">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">Signals</p>
              <ul className="mt-3 space-y-2">
                {Object.entries(explain.signals ?? {}).map(([key, value]) => (
                  <li key={key} className="flex items-center justify-between">
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-[color:var(--text)]">{typeof value === 'number' ? value.toFixed(2) : value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {attempt && explain && (
        <Card className="space-y-3">
          <p className="text-sm text-[color:var(--text-muted)]">Signal dashboard</p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-xs text-[color:var(--text-muted)]">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">STAR coverage</p>
              <p className="mt-2 text-2xl font-semibold text-[color:var(--text)]">{Math.round((signals.starCoverage ?? 0) * 100)}%</p>
              <div className="mt-3 h-2 w-full rounded-full bg-[color:var(--surface)]">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{ width: `${scaleSignal((signals.starCoverage ?? 0) * 100, 0, 100)}%` }}
                />
              </div>
            </div>
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-xs text-[color:var(--text-muted)]">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">Result strength</p>
              <p className="mt-2 text-2xl font-semibold text-[color:var(--text)]">{Math.round((signals.resultStrength ?? 0) * 100)}%</p>
              <div className="mt-3 h-2 w-full rounded-full bg-[color:var(--surface)]">
                <div
                  className="h-2 rounded-full bg-[color:var(--accent-2)]"
                  style={{ width: `${scaleSignal((signals.resultStrength ?? 0) * 100, 0, 100)}%` }}
                />
              </div>
            </div>
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-xs text-[color:var(--text-muted)]">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">WPM</p>
              <p className="mt-2 text-2xl font-semibold text-[color:var(--text)]">{Math.round(signals.wpm ?? 0)}</p>
              <div className="mt-3 h-2 w-full rounded-full bg-[color:var(--surface)]">
                <div
                  className="h-2 rounded-full bg-amber-500"
                  style={{ width: `${scaleSignal(signals.wpm ?? 0, 90, 170)}%` }}
                />
              </div>
            </div>
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-xs text-[color:var(--text-muted)]">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">Filler rate</p>
              <p className="mt-2 text-2xl font-semibold text-[color:var(--text)]">{(signals.fillerRate ?? 0).toFixed(2)}</p>
              <div className="mt-3 h-2 w-full rounded-full bg-[color:var(--surface)]">
                <div
                  className="h-2 rounded-full bg-rose-500"
                  style={{ width: `${scaleSignal(signals.fillerRate ?? 0, 0, 6, true)}%` }}
                />
              </div>
            </div>
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-xs text-[color:var(--text-muted)]">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">Hedge rate</p>
              <p className="mt-2 text-2xl font-semibold text-[color:var(--text)]">{(signals.hedgeRate ?? 0).toFixed(2)}</p>
              <div className="mt-3 h-2 w-full rounded-full bg-[color:var(--surface)]">
                <div
                  className="h-2 rounded-full bg-rose-500"
                  style={{ width: `${scaleSignal(signals.hedgeRate ?? 0, 0, 6, true)}%` }}
                />
              </div>
            </div>
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-xs text-[color:var(--text-muted)]">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">Sentence length</p>
              <p className="mt-2 text-2xl font-semibold text-[color:var(--text)]">{Math.round(signals.avgSentenceLength ?? 0)}</p>
              <div className="mt-3 h-2 w-full rounded-full bg-[color:var(--surface)]">
                <div
                  className="h-2 rounded-full bg-[color:var(--accent-2)]"
                  style={{ width: `${scaleSignal(signals.avgSentenceLength ?? 0, 8, 26, true)}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {attempt && compareAttempts.length > 1 && (
        <Card className="space-y-3">
          <p className="text-sm text-[color:var(--text-muted)]">Compare recent attempts</p>
          <div className="grid gap-3 md:grid-cols-2">
            {compareAttempts.map((entry, index) => (
              <div key={entry.id} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text-muted)]">
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">
                  {index === 0 ? 'Latest' : 'Previous'}
                </p>
                <p className="mt-2 text-2xl font-semibold text-[color:var(--text)]">{entry.scoreOverall ?? 0}</p>
                <p className="mt-1 text-xs text-[color:var(--text-muted)]">{new Date(entry.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <EmptyState
        title="Next steps"
        description="Try another question or end the session to review your dashboard."
        action={
          <div className="flex gap-3">
            <Button asChild variant="secondary">
              <Link href={`/sessions/${session.id}/question${question ? `?slug=${question.slug}` : ''}`}>Next question</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">End session</Link>
            </Button>
          </div>
        }
      />
    </PageContainer>
  );
}
