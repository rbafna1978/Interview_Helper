'use client';
import { useContext } from 'react';
import { AuthCtx } from '@/components/AuthProvider';

export default function SessionBanner() {
  const { user } = useContext(AuthCtx);
  if (user) return null;
  return (
    <div className="rounded-2xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
      You’re in <span className="font-semibold">guest mode</span>. Attempts stay on this device only.
      <a href="/auth" className="ml-2 underline underline-offset-4">Connect Supabase</a> to sync history across
      browsers.
    </div>
  );
}
