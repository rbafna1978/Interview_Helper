'use client';
import Link from 'next/link';
import { useContext } from 'react';
import { AuthCtx } from '@/components/AuthProvider';
import SessionBanner from '@/components/SessionBanner';
import { QUESTIONS } from '@/lib/questions';
import { supabase, hasSupabase } from '@/lib/supabase/client';

export default function Dashboard() {
  const { user } = useContext(AuthCtx);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 text-slate-100">
      <section className="rounded-3xl border border-slate-800 bg-slate-950/60 p-8 shadow-2xl shadow-sky-500/5">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">Practice workspace</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back{user ? `, ${user.email}` : ''}</h1>
            <p className="mt-3 max-w-xl text-sm text-slate-300">
              Jump into a guided interview question or run a freestyle prompt. We recommend two focused reps per
              question with a quick reflection between runs.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <Link
                href="/record"
                className="rounded-full border border-slate-700 px-4 py-2 font-medium text-slate-200 hover:border-slate-500 hover:text-white"
              >
                Freestyle recording
              </Link>
              <Link
                href="/auth"
                className="rounded-full border border-slate-700 px-4 py-2 font-medium text-slate-200 hover:border-slate-500 hover:text-white"
              >
                {user ? 'Manage account' : 'Sign in for sync'}
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Current session</p>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center justify-between">
                <span>Mode</span>
                <span className="font-mono text-slate-100">{user ? 'Synced' : 'Guest only'}</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Question bank</span>
                <span className="font-mono text-slate-100">{QUESTIONS.length} prompts</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Recommended pace</span>
                <span className="font-mono text-slate-100">2 reps / day</span>
              </li>
            </ul>
            {user && hasSupabase && (
              <button
                onClick={() => {
                  supabase?.auth.signOut().finally(() => location.reload());
                }}
                className="mt-6 w-full rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="mt-6">
        <SessionBanner />
      </div>

      <section className="mt-10 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Guided questions</h2>
          <p className="text-sm text-slate-400">
            Each card opens the recorder with the prompt pre-filled. Aim for 90 seconds and focus on a crisp STAR arc.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {QUESTIONS.map((q, idx) => (
            <div
              key={q.slug}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 transition hover:border-slate-600 hover:bg-slate-950/80"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">Prompt {idx + 1}</p>
              <h3 className="mt-3 text-base font-medium text-white">{q.text}</h3>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>Suggested duration: 1-2 minutes</span>
                <Link
                  href={`/question/${q.slug}`}
                  className="rounded-full bg-sky-500 px-3 py-1.5 font-medium text-slate-950 hover:bg-sky-400"
                >
                  Record
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
