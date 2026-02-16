'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/sessions',
    label: 'Sessions',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: '/question-bank',
    label: 'Question Bank',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M4 6h16M4 10h16M4 14h10" strokeLinecap="round" />
        <rect x="4" y="3" width="16" height="18" rx="2" />
      </svg>
    ),
  },
  {
    href: '/practice-plan',
    label: 'Practice Plan',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    ),
  },
];

type NavItem = typeof navItems[number] & { disabled?: boolean };

export function DashboardSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const renderLinks = () => (
    <nav className="space-y-0.5">
      {(navItems as NavItem[]).map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.disabled ? '#' : item.href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              active
                ? 'border-l-2 border-[color:var(--accent)] bg-[color:var(--surface-muted)] text-[color:var(--text)]'
                : 'border-l-2 border-transparent text-[color:var(--text-muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]',
              item.disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent hover:text-[color:var(--text-muted)]'
            )}
          >
            <span className={active ? 'text-[color:var(--accent)]' : ''}>{item.icon}</span>
            {item.label}
            {item.disabled && <span className="ml-auto text-[10px] text-[color:var(--text-muted)]">Soon</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <aside className="border-r border-[color:var(--border)] bg-[color:var(--surface)] md:sticky md:top-16 md:h-[calc(100vh-64px)]">
      {/* Mobile toggle */}
      <div className="px-4 py-3 md:hidden">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--border)] text-[color:var(--text-muted)] hover:text-[color:var(--text)] transition"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          )}
        </button>
        {open && <div className="mt-3">{renderLinks()}</div>}
      </div>

      {/* Desktop */}
      <div className="hidden h-full flex-col px-3 py-6 md:flex">
        <div className="mb-6 px-3">
          <p className="font-serif text-base font-semibold text-[color:var(--text)]">Interview Coach</p>
          <p className="text-xs text-[color:var(--text-muted)]">AI-powered practice</p>
        </div>
        {renderLinks()}
      </div>
    </aside>
  );
}
