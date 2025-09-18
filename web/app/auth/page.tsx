'use client';
import { supabase, hasSupabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const authEnabled = hasSupabase;

  async function signInGoogle() {
    if (!supabase) {
      setErr('Hosted sign-in is not configured. Add Supabase keys to enable account login.');
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/dashboard` },
    });
  }

  async function signInEmail() {
    try {
      if (!supabase) throw new Error('Hosted sign-in is not configured.');
      setLoading(true); setErr(null); setInfo(null);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/dashboard` },
      });
      if (error) throw error;
      setInfo('Check your email for a sign-in link.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign-in failed';
      setErr(message);
    } finally { setLoading(false); }
  }

  function asGuest() {
    router.push('/dashboard'); // guests work without any extra state now
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-slate-100">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in to keep your progress</h1>
      <p className="mt-2 text-sm text-slate-300">Practice behavioral interviews with AI feedback and sync attempts across devices.</p>
      {!authEnabled && (
        <p className="mt-4 rounded-2xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
          Account logins are disabled because Supabase credentials are not set. Continue as a guest or add Supabase
          environment variables to unlock authentication.
        </p>
      )}

      <div className="mt-8 space-y-3">
        <button
          onClick={signInGoogle}
          disabled={!authEnabled}
          className="w-full rounded-full bg-sky-500 px-5 py-3 text-sm font-medium text-slate-950 shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continue with Google
        </button>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-4">
          <label className="text-xs uppercase tracking-[0.25em] text-slate-400">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />
          <button
            onClick={signInEmail}
            disabled={loading || !email || !authEnabled}
            className="mt-3 w-full rounded-full bg-sky-500 px-5 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Sending link…' : 'Send magic link'}
          </button>
          {info && <div className="mt-3 rounded border border-emerald-500/40 bg-emerald-500/10 p-2 text-sm text-emerald-200">{info}</div>}
          {err && <div className="mt-3 rounded border border-red-500/40 bg-red-500/10 p-2 text-sm text-red-200">{err}</div>}
        </div>

        <button
          onClick={asGuest}
          className="w-full rounded-full border border-slate-700 px-5 py-2 text-sm font-medium text-slate-200 hover:border-slate-500 hover:text-white"
        >
          Continue as guest
        </button>
        <p className="mt-2 text-xs text-slate-400">
          As a guest, attempts are saved only in this browser.
        </p>
      </div>
    </main>
  );
}
