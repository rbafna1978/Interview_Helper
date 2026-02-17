'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestOtp() {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      setCode('');
      await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStep('code');
      setMessage('Check your email for a 6-digit code. It expires in 10 minutes.');
    } catch {
      setError('Unable to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    try {
      setLoading(true);
      setError(null);
      const result = await signIn('otp', {
        email,
        code,
        redirect: false,
      });
      if (result?.error) {
        setError('Invalid code. Try again or request a new one.');
        return;
      }
      setMessage('Signed in! Redirecting…');
      router.push('/dashboard');
    } catch {
      setError('Failed to verify code.');
    } finally {
      setLoading(false);
    }
  }

  async function claimHistory() {
    try {
      const res = await fetch('/api/auth/claim-guest', { method: 'POST' });
      if (res.status === 401) {
        setError('Sign in first to merge your history.');
        return;
      }
      setMessage('Guest history linked to your account.');
    } catch {
      setError('Could not claim history.');
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-[color:var(--text)]">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in to save your progress</h1>
      <p className="mt-2 text-sm text-[color:var(--text-muted)]">
        We&apos;ll email you a one-time code — no password needed. Codes expire after 10 minutes.
      </p>

      <div className="mt-8 space-y-4 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_12px_30px_var(--shadow)]">
        {step === 'email' ? (
          <>
            <label className="text-sm font-medium text-[color:var(--text-muted)]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-muted)] focus:outline-none"
            />
            <button
              onClick={requestOtp}
              disabled={!email || loading}
              className="mt-3 w-full rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Email me a code'}
            </button>
          </>
        ) : (
          <>
            <label className="text-sm font-medium text-[color:var(--text-muted)]">Enter your 6-digit code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="mt-2 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-muted)] focus:outline-none tracking-[0.4em] text-center"
            />
            <div className="flex gap-3">
              <button
                onClick={verifyOtp}
                disabled={code.length !== 6 || loading}
                className="mt-3 w-full rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Verifying…' : 'Verify & sign in'}
              </button>
              <button
                onClick={requestOtp}
                className="mt-3 rounded-full border border-[color:var(--border)] px-4 py-2 text-xs font-semibold text-[color:var(--text-muted)] hover:text-[color:var(--text)] transition"
              >
                Resend
              </button>
            </div>
          </>
        )}
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full rounded-full border border-[color:var(--border)] px-5 py-2 text-sm font-medium text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
        >
          Continue as guest
        </button>
        <button
          onClick={claimHistory}
          className="w-full rounded-full border border-[color:var(--border)] px-5 py-2 text-sm font-medium text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
        >
          Claim my guest history
        </button>
        {message && <p className="text-xs text-emerald-600">{message}</p>}
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    </main>
  );
}
