'use client';
import { useState } from 'react';
import Recorder from '@/components/Recorder';
import type { AttemptRecord } from '@/lib/types';

const DEFAULT_PROMPT = 'Tell me about a challenge you faced and how you handled it.';

export default function RecordPage() {
  const [question, setQuestion] = useState(DEFAULT_PROMPT);
  const [sessionAttempts, setSessionAttempts] = useState<AttemptRecord[]>([]);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 text-[color:var(--text)]">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">Freestyle mode</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Record a practice answer</h1>
        <p className="mt-3 max-w-3xl text-sm text-[color:var(--text-muted)]">
          Paste any prompt you want to rehearse, record right in the browser, and let the local AI coach deliver
          transcript, scoring, and coaching notes. Nothing uploads until you decide to sync.
        </p>
      </header>

      <section className="mt-8 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[0_12px_30px_var(--shadow)]">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.25em] text-[color:var(--text-muted)]">Prompt</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-muted)] focus:outline-none"
                placeholder="Describe a time you delivered impact under pressure."
              />
            </div>
            <p className="text-xs text-[color:var(--text-muted)]">
              Tip: Keep the question focused on a single story. The AI feedback works best when you anchor on one
              challenge and walk through the STAR framework.
            </p>
            <Recorder
              question={question || DEFAULT_PROMPT}
              questionId={null}
              history={sessionAttempts}
              onScored={(payload) => {
                setSessionAttempts((prev) => [{ ...payload, created_at: Date.now() }, ...prev].slice(0, 5));
              }}
            />
          </div>
          <aside className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5 text-sm text-[color:var(--text-muted)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-[color:var(--text-muted)]">Why freestyle?</h2>
            <ul className="mt-4 space-y-3">
              <li className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                Swap in prompts from upcoming interviews or behavioural rubrics to rehearse exactly what matters.
              </li>
              <li className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                Run rapid iterations: record, review the transcript, tweak your framing, and go again.
              </li>
              <li className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                Signed-in users can copy polished attempts into their synced history directly from the question pages.
              </li>
            </ul>
          </aside>
        </div>
      </section>
    </main>
  );
}
