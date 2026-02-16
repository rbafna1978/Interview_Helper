"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useToast } from '@/components/ui/Toast';

type PracticeTask = {
  id: string;
  title: string;
  details?: string | null;
  isDone: boolean;
  dueDate?: string | null;
};

type PracticePlan = {
  id: string;
  startDate: string;
  endDate: string;
  tasks: PracticeTask[];
};

export default function PracticePlanClient({ isGuest }: { isGuest: boolean }) {
  const { notify } = useToast();
  const [plan, setPlan] = useState<PracticePlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/practice-plan');
        if (!res.ok) return;
        const data = (await res.json()) as { plan?: PracticePlan | null };
        if (active) setPlan(data.plan ?? null);
      } catch {
        // ignore for now
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [isGuest]);

  async function toggleTask(task: PracticeTask) {
    try {
      const res = await fetch(`/api/practice-plan/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDone: !task.isDone }),
      });
      if (!res.ok) {
        notify({ title: 'Update failed', description: 'Try again in a moment.', tone: 'error' });
        return;
      }
      const data = (await res.json()) as { task?: PracticeTask };
      setPlan((current) =>
        current
          ? {
              ...current,
              tasks: current.tasks.map((item) => (item.id === task.id ? { ...item, isDone: data.task?.isDone ?? !item.isDone } : item)),
            }
          : current
      );
    } catch {
      notify({ title: 'Update failed', description: 'Network error.', tone: 'error' });
    }
  }

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-[color:var(--text-muted)]">Loading practice plan…</p>
      </Card>
    );
  }

  if (isGuest) {
    return (
      <Card className="space-y-3">
        <p className="text-sm text-[color:var(--text-muted)]">Practice plan</p>
        <p className="text-base text-[color:var(--text)]">Sign in to generate and track your 7-day practice plan.</p>
        <Button asChild variant="secondary">
          <Link href="/auth">Sign in</Link>
        </Button>
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card className="space-y-3">
        <p className="text-sm text-[color:var(--text-muted)]">Practice plan</p>
        <p className="text-base text-[color:var(--text)]">Record an answer to generate your first plan.</p>
        <Button asChild variant="secondary">
          <Link href="/sessions/new">Start a session</Link>
        </Button>
      </Card>
    );
  }

  const completed = plan.tasks.filter((task) => task.isDone).length;
  const progress = plan.tasks.length ? (completed / plan.tasks.length) * 100 : 0;

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[color:var(--text-muted)]">This week</p>
            <p className="text-base text-[color:var(--text)]">
              {new Date(plan.startDate).toLocaleDateString()} — {new Date(plan.endDate).toLocaleDateString()}
            </p>
          </div>
          <span className="text-xs text-[color:var(--text-muted)]">
            {completed}/{plan.tasks.length} done
          </span>
        </div>
        <ProgressBar value={progress} />
      </Card>

      <div className="grid gap-3">
        {plan.tasks.map((task) => (
          <Card key={task.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[color:var(--text)]">{task.title}</p>
                {task.details && <p className="text-xs text-[color:var(--text-muted)]">{task.details}</p>}
              </div>
              <button
                onClick={() => toggleTask(task)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  task.isDone ? 'border-emerald-400/50 text-emerald-600' : 'border-[color:var(--border)] text-[color:var(--text-muted)]'
                }`}
              >
                {task.isDone ? 'Completed' : 'Mark done'}
              </button>
            </div>
            {task.dueDate && (
              <p className="text-xs text-[color:var(--text-muted)]">Due {new Date(task.dueDate).toLocaleDateString()}</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
