"use client";

import { useEffect, useState } from 'react';

type ThemeValue = 'light' | 'dark' | 'system';

const order: ThemeValue[] = ['light', 'dark', 'system'];

function resolveTheme(value: ThemeValue) {
  if (value !== 'system') return value;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function labelFor(value: ThemeValue) {
  if (value === 'light') return 'Light';
  if (value === 'dark') return 'Dark';
  return 'System';
}

function iconFor(value: ThemeValue) {
  if (value === 'light') return '☀︎';
  if (value === 'dark') return '☾';
  return '◒';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeValue>('system');

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as ThemeValue | null) ?? 'system';
    setTheme(stored);
  }, []);

  useEffect(() => {
    const resolved = resolveTheme(theme);
    document.documentElement.dataset.theme = resolved;
    localStorage.setItem('theme', theme);
  }, [theme]);

  function cycle() {
    const idx = order.indexOf(theme);
    const next = order[(idx + 1) % order.length];
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${labelFor(theme)}`}
      title={`Theme: ${labelFor(theme)}`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] text-xs text-[color:var(--text)] shadow-sm transition hover:bg-[color:var(--surface-muted)]"
    >
      {iconFor(theme)}
    </button>
  );
}
