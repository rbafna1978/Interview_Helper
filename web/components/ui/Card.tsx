import * as React from 'react';
import { cn } from '@/lib/utils';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'muted';
};

export function Card({ className, variant = 'default', ...props }: CardProps) {
  const base =
    variant === 'muted'
      ? 'rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5 shadow-[0_8px_24px_var(--shadow)] transition duration-200'
      : 'rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_8px_24px_var(--shadow)] transition duration-200';

  return <div className={cn(base, className)} {...props} />;
}
