import { cn } from '@/lib/utils';

type ProgressBarProps = {
  value: number;
  max?: number;
  className?: string;
  tone?: 'default' | 'good' | 'warn' | 'bad';
};

export function ProgressBar({ value, max = 100, className, tone = 'default' }: ProgressBarProps) {
  const safe = Math.max(0, Math.min(value, max));
  const percent = (safe / max) * 100;
  const toneClasses = {
    default: 'bg-[color:var(--accent)]',
    good: 'bg-[color:var(--ok)]',
    warn: 'bg-[color:var(--warn)]',
    bad: 'bg-[color:var(--danger)]',
  }[tone];

  return (
    <div className={cn('h-2 w-full rounded-full bg-[color:var(--surface-muted)]', className)}>
      <div className={cn('h-full rounded-full transition-all', toneClasses)} style={{ width: `${percent}%` }} />
    </div>
  );
}
