'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

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

  const renderLinks = () => (
    <nav className="space-y-0.5">
      {(navItems as NavItem[]).map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.disabled ? '#' : item.href}
            className={cn(
              'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
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

export function DashboardMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--border)] bg-[color:var(--surface)]/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5 gap-1">
        {(navItems as NavItem[]).map((item) => {
          const active = pathname?.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.disabled ? '#' : item.href}
                className={cn(
                  'flex min-h-11 flex-col items-center justify-center rounded-xl px-2 py-1 text-[11px] font-medium transition',
                  active
                    ? 'bg-[color:var(--surface-muted)] text-[color:var(--text)]'
                    : 'text-[color:var(--text-muted)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text)]',
                  item.disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent hover:text-[color:var(--text-muted)]'
                )}
              >
                <span className={cn('mb-0.5', active && 'text-[color:var(--accent)]')}>{item.icon}</span>
                <span className="truncate">{item.label.replace('Question Bank', 'Questions').replace('Practice Plan', 'Plan')}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
