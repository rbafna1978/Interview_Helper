'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useSession } from 'next-auth/react';
import ThemeToggle from '@/components/theme/ThemeToggle';

const marketingLinks = [
  { href: '/', label: 'Home' },
  { href: '/question-bank', label: 'Question bank' },
  { href: '/sessions', label: 'Sessions' },
];

export function AppHeader() {
  const pathname = usePathname();
  const { status } = useSession();

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[color:var(--bg)]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-base font-semibold tracking-tight text-[color:var(--text)]">
          Interview Coach
        </Link>
        <nav className="flex flex-1 items-center gap-4 overflow-x-auto px-2 text-sm text-[color:var(--text-muted)] md:justify-center">
          {marketingLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap hover:text-[color:var(--text)] ${
                pathname === link.href ? 'text-[color:var(--text)]' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
          {status === 'authenticated' && (
            <Link
              href="/dashboard"
              className={`whitespace-nowrap hover:text-[color:var(--text)] ${
                pathname === '/dashboard' ? 'text-[color:var(--text)]' : ''
              }`}
            >
              Dashboard
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="secondary">
            <Link href="/auth">{status === 'authenticated' ? 'Account' : 'Sign in'}</Link>
          </Button>
          <Button asChild>
            <Link href="/question/challenge-star">Start practicing</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
