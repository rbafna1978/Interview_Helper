import * as React from 'react';
import { cn } from '@/lib/utils';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'muted';
};

export function Card({ className, variant = 'default', ...props }: CardProps) {
  const base =
    variant === 'muted'
      ? 'rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5'
      : 'rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5';

  return <div className={cn(base, className)} {...props} />;
}
