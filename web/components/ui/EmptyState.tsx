import { cn } from '@/lib/utils';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface-muted)] p-6 text-center',
        className
      )}
    >
      <h3 className="text-base font-semibold text-[color:var(--text)]">{title}</h3>
      {description && <p className="mt-2 text-sm text-[color:var(--text-muted)]">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
