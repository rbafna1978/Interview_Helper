'use client';
import Link from 'next/link';
import { useContext } from 'react';
import { AuthCtx } from '@/components/AuthProvider';
import SessionBanner from '@/components/SessionBanner';
import { QUESTIONS } from '@/lib/questions';
import { supabase } from '@/lib/supabase/client';

export default function Dashboard() {
  const { user } = useContext(AuthCtx);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-zinc-100">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Practice</h1>
        <div className="flex items-center gap-3">
          {user && <span className="text-sm text-zinc-400">{user.email}</span>}
          {user ? (
            <button
              onClick={() => supabase.auth.signOut().then(()=>location.reload())}
              className="text-sm underline"
            >
              Sign out
            </button>
          ) : (
            <Link href="/auth" className="text-sm underline">Sign in</Link>
          )}
        </div>
      </div>

      <SessionBanner />

      <div className="mt-6 space-y-4">
        {QUESTIONS.map(q => (
          <div key={q.slug} className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900 p-4">
            <div className="text-sm sm:text-base">{q.text}</div>
            <Link href={`/question/${q.slug}`} className="rounded bg-white text-black px-3 py-2">
              Record
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}