'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useSession } from 'next-auth/react';
import ThemeToggle from '@/components/theme/ThemeToggle';

export function AppHeader() {
  const { status } = useSession();

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[color:var(--bg)]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-lg font-bold text-[color:var(--text)]">Interview Coach</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {status === 'authenticated' ? (
            <Button asChild variant="secondary">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/auth">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/question/challenge-star">Start practicing</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
