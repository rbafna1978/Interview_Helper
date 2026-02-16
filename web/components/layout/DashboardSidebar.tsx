'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/sessions', label: 'Sessions' },
  { href: '/question-bank', label: 'Question Bank' },
  { href: '/practice-plan', label: 'Practice Plan' },
  { href: '/settings', label: 'Settings' },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const renderLinks = () => (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.disabled ? '#' : item.href}
            onClick={() => setOpen(false)}
            className={cn(
              'block rounded-xl px-4 py-2 text-sm font-medium transition',
              active
                ? 'bg-[color:var(--surface-muted)] text-[color:var(--text)]'
                : 'text-[color:var(--text-muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]',
              item.disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent hover:text-[color:var(--text-muted)]'
            )}
          >
            {item.label}
            {item.disabled && <span className="ml-2 text-[10px] uppercase tracking-widest">Soon</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <aside className="border-r border-[color:var(--border)] bg-[color:var(--surface)] md:sticky md:top-16 md:h-[calc(100vh-64px)]">
      <div className="px-4 py-4 md:hidden">
        <Button variant="secondary" className="w-full" onClick={() => setOpen((prev) => !prev)}>
          {open ? 'Close menu' : 'Open menu'}
        </Button>
        {open && <div className="mt-4">{renderLinks()}</div>}
      </div>
      <div className="hidden h-full flex-col px-4 py-6 md:flex">{renderLinks()}</div>
    </aside>
  );
}
