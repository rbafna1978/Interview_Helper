'use client';
import { useContext } from 'react';
import { AuthCtx } from '@/components/AuthProvider';

export default function SessionBanner() {
  const { user } = useContext(AuthCtx);
  if (user) return null;
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text-muted)]">
      You’re in <span className="font-semibold">guest mode</span>. Attempts stay on this device only.
      <a href="/auth" className="ml-2 underline underline-offset-4 text-[color:var(--accent)]">Sign in</a> to sync progress securely.
    </div>
  );
}
