'use client';
import { useContext } from 'react';
import { AuthCtx } from '@/components/AuthProvider';

export default function SessionBanner() {
  const { user } = useContext(AuthCtx);
  if (user) return null;
  return (
    <div className="mb-4 rounded border border-amber-500/60 bg-amber-900/20 p-3 text-sm text-amber-200">
      You’re practicing as a <b>guest</b>. Attempts are stored only in this browser and may be lost.
      <a href="/auth" className="ml-1 underline">Create an account</a> to keep results.
    </div>
  );
}