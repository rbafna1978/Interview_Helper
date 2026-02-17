'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useSession } from 'next-auth/react';
import ThemeToggle from '@/components/theme/ThemeToggle';

export function AppHeader() {
  const { status } = useSession();

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[color:var(--bg)]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-4">
        <Link href="/" className="min-w-0 flex items-center gap-2">
          <span className="truncate font-serif text-base font-bold text-[color:var(--text)] sm:text-lg">Interview Coach</span>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {status === 'authenticated' ? (
            <Button asChild variant="secondary" className="px-3 text-xs sm:px-4 sm:text-sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="px-3 text-xs sm:px-4 sm:text-sm">
                <Link href="/auth">Sign in</Link>
              </Button>
              <Button asChild className="px-3 text-xs sm:px-4 sm:text-sm">
                <Link href="/question/challenge-star">
                  <span className="sm:hidden">Start</span>
                  <span className="hidden sm:inline">Start practicing</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
