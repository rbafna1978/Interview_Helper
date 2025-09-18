'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useContext } from 'react';
import { getQuestion } from '@/lib/questions';
import Recorder from '@/components/Recorder';
import AttemptCard from '@/components/AttemptCard';
import SessionBanner from '@/components/SessionBanner';
import { AuthCtx } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import type { AttemptFeedback, AttemptRecord } from '@/lib/types';

export default function QuestionPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const q = getQuestion(slug);
  const { user } = useContext(AuthCtx);

  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const localKey = `coach.attempts.${slug}`;

  useEffect(() => {
    if (!q) { router.replace('/dashboard'); return; }
    (async () => {
      if (user && supabase) {
        const { data, error } = await supabase
          .from('attempts')
          .select('*')
          .eq('question_slug', slug)
          .order('created_at', { ascending: false })
          .limit(20);
        if (!error) setAttempts((data as AttemptRecord[]) || []);
      } else {
        const raw = localStorage.getItem(localKey);
        setAttempts(raw ? (JSON.parse(raw) as AttemptRecord[]) : []);
      }
    })();
  }, [slug, q, user, router, localKey]);

  async function onScored(payload: AttemptFeedback) {
    if (user && supabase) {
      const { error: insertError } = await supabase
        .from('attempts')
        .insert({
          user_id: user.id, // RLS requires this to match auth.uid()
          question_slug: slug,
          duration_seconds: payload.duration_seconds ?? 0,
          transcript: payload.transcript,
          scores: payload.scores,
          suggestions: payload.suggestions,
          language: payload.language,
        });
      if (insertError) {
        console.warn('Failed to persist attempt to Supabase', insertError);
        const next: AttemptRecord[] = [{ ...payload, created_at: Date.now() }, ...attempts].slice(0, 20);
        if (typeof window !== 'undefined') {
          localStorage.setItem(localKey, JSON.stringify(next));
        }
        setAttempts(next);
        return;
      }

      const { data } = await supabase
        .from('attempts')
        .select('*')
        .eq('question_slug', slug)
        .order('created_at', { ascending: false })
        .limit(20);
      setAttempts((data as AttemptRecord[]) || []);
    } else {
      const next: AttemptRecord[] = [{ ...payload, created_at: Date.now() }, ...attempts].slice(0, 20);
      localStorage.setItem(localKey, JSON.stringify(next));
      setAttempts(next);
    }
  }

  if (!q) return null;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 text-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-xs uppercase tracking-[0.3em] text-sky-300/70 hover:text-sky-200">
            Back to questions
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{q.text}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">
            Aim for a tight story: set the scene fast, describe the challenge, showcase your actions, then land on
            measurable results and learnings.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <SessionBanner />
      </div>

      <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg shadow-sky-500/10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="lg:w-[55%]">
            <h2 className="text-xl font-semibold text-white">Record this attempt</h2>
            <p className="mt-2 text-sm text-slate-300">
              Keep it conversational. Two minutes is plenty of time for an impactful STAR story. The preview stays on
              your device; only signed-in users sync attempts to Supabase.
            </p>
            <div className="mt-5">
              <Recorder question={q.text} questionId={slug} onScored={onScored} history={attempts} />
            </div>
          </div>
          <aside className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-sm text-slate-300 lg:w-[45%]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-300">Prep reminders</h3>
            <ul className="mt-4 space-y-3">
              <li className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                <p className="font-medium text-white">Situation</p>
                <p className="mt-1 text-xs text-slate-400">20 seconds max. Give just enough context to make the challenge real.</p>
              </li>
              <li className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                <p className="font-medium text-white">Action</p>
                <p className="mt-1 text-xs text-slate-400">Highlight what you personally did. Speak to decisions and trade-offs.</p>
              </li>
              <li className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                <p className="font-medium text-white">Result</p>
                <p className="mt-1 text-xs text-slate-400">Quantify impact and close with what you learned for the next time.</p>
              </li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Practice history</h2>
          {attempts.length > 0 && (
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{attempts.length} attempt(s)</p>
          )}
        </div>
        {attempts.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-300">
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
