'use client';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signInGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/dashboard` },
    });
  }

  async function signInEmail() {
    try {
      setLoading(true); setErr(null); setInfo(null);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/dashboard` },
      });
      if (error) throw error;
      setInfo('Check your email for a sign-in link.');
    } catch (e:any) {
      setErr(e.message || 'Sign-in failed');
    } finally { setLoading(false); }
  }

  function asGuest() {
    router.push('/dashboard'); // guests work without any extra state now
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-zinc-100">
      <h1 className="text-3xl font-semibold">Welcome</h1>
      <p className="mt-2 text-zinc-400">Practice behavioral interviews with AI feedback.</p>

      <div className="mt-8 space-y-3">
        <button onClick={signInGoogle} className="w-full rounded bg-white text-black px-4 py-2">
          Continue with Google
        </button>

        <div className="rounded border border-zinc-700 p-3">
          <label className="text-sm text-zinc-400">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 p-2"
          />
          <button onClick={signInEmail} disabled={loading || !email} className="mt-2 w-full rounded bg-blue-600 px-4 py-2 disabled:opacity-50">
            {loading ? 'Sending link…' : 'Send magic link'}
          </button>
          {info && <div className="mt-2 text-sm text-emerald-300">{info}</div>}
          {err && <div className="mt-2 text-sm text-red-300">{err}</div>}
        </div>

        <button onClick={asGuest} className="w-full rounded border border-amber-500 text-amber-200 px-4 py-2">
          Continue as guest
        </button>
        <p className="mt-2 text-sm text-amber-300">
          As a guest, attempts are saved only in this browser.
        </p>
      </div>
    </main>
  );
}