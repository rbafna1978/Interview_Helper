'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useContext } from 'react';
import Recorder from '@/components/Recorder';
import AttemptCard from '@/components/AttemptCard';
import SessionBanner from '@/components/SessionBanner';
import { AuthCtx } from '@/components/AuthProvider';
import type { AttemptFeedback, AttemptRecord, QuestionSummary } from '@/lib/types';

async function fetchQuestion(slug: string): Promise<QuestionSummary | null> {
  try {
    const res = await fetch(`/api/questions?slug=${slug}`);
    if (!res.ok) return null;
    const payload = (await res.json()) as { question?: QuestionSummary | null };
    return payload.question ?? null;
  } catch {
    return null;
  }
}

export default function QuestionPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useContext(AuthCtx);

  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [question, setQuestion] = useState<QuestionSummary | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const localKey = `coach.attempts.${slug}`;

  useEffect(() => {
    let active = true;
    setLoadingQuestion(true);
    fetchQuestion(slug).then((result) => {
      if (!active) return;
      setQuestion(result);
      setLoadingQuestion(false);
      if (!result) {
        router.replace('/dashboard');
      }
    });
    return () => {
      active = false;
    };
  }, [slug, router]);

  useEffect(() => {
    if (!question) return;
    const raw = localStorage.getItem(localKey);
    setAttempts(raw ? (JSON.parse(raw) as AttemptRecord[]) : []);
  }, [slug, question, router, localKey]);

  async function onScored(payload: AttemptFeedback) {
    const next: AttemptRecord[] = [{ ...payload, created_at: Date.now() }, ...attempts].slice(0, 20);
    localStorage.setItem(localKey, JSON.stringify(next));
    setAttempts(next);
  }

  if (loadingQuestion) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-12 text-[color:var(--text)]">
        <p className="text-[color:var(--text-muted)]">Loading question…</p>
      </main>
    );
  }
  if (!question) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-12 text-[color:var(--text)]">
        <p className="rounded-2xl border border-amber-300 bg-amber-100 p-6 text-sm text-amber-900">
          Question not found. Seed the default question bank via <code>npm run db:seed</code> or the dashboard button, then try again.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 text-[color:var(--text)]">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)] hover:text-[color:var(--text)]">
            Back to questions
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{question.text}</h1>
          <p className="mt-2 max-w-3xl text-sm text-[color:var(--text-muted)]">
            Aim for a tight story: set the scene fast, describe the challenge, showcase your actions, then land on
            measurable results and learnings.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <SessionBanner />
      </div>

      <section className="mt-8 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[0_12px_30px_var(--shadow)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="lg:w-[55%]">
            <h2 className="text-xl font-semibold text-[color:var(--text)]">Record this attempt</h2>
            <p className="mt-2 text-sm text-[color:var(--text-muted)]">
              Keep it conversational. Two minutes is plenty of time for an impactful STAR story. The preview stays on
              your device; signed-in users can sync attempts.
            </p>
            <div className="mt-5">
              <Recorder question={question.text} questionId={slug} onScored={onScored} history={attempts} />
            </div>
          </div>
          <aside className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5 text-sm text-[color:var(--text-muted)] lg:w-[45%]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-[color:var(--text-muted)]">Prep reminders</h3>
            <ul className="mt-4 space-y-3">
              <li className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                <p className="font-medium text-[color:var(--text)]">Situation</p>
                <p className="mt-1 text-xs text-[color:var(--text-muted)]">20 seconds max. Give just enough context to make the challenge real.</p>
              </li>
              <li className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                <p className="font-medium text-[color:var(--text)]">Action</p>
                <p className="mt-1 text-xs text-[color:var(--text-muted)]">Highlight what you personally did. Speak to decisions and trade-offs.</p>
              </li>
              <li className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                <p className="font-medium text-[color:var(--text)]">Result</p>
                <p className="mt-1 text-xs text-[color:var(--text-muted)]">Quantify impact and close with what you learned for the next time.</p>
              </li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Practice history</h2>
          {attempts.length > 0 && (
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">{attempts.length} attempt(s)</p>
          )}
        </div>
        {attempts.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--text-muted)]">
            No attempts yet. Record above and you will see the AI scores and transcript history here.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {attempts.map((attempt, index) => (
              <AttemptCard key={attempt.id ?? index} a={attempt} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
