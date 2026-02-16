import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';

type ScoreItem = {
  key: string;
  label: string;
  value: number;
};

function toneFor(value: number) {
  if (value >= 80) return 'good';
  if (value >= 60) return 'default';
  if (value >= 40) return 'warn';
  return 'bad';
}

export function ScoreBreakdown({ scores }: { scores: ScoreItem[] }) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[color:var(--text-muted)]">Score breakdown</p>
        <span className="text-xs text-[color:var(--text-muted)]">Rubric-based</span>
      </div>
      <div className="space-y-4">
        {scores.map((score) => (
          <div key={score.key} className="space-y-2">
            <div className="flex items-center justify-between text-sm text-[color:var(--text)]">
              <span>{score.label}</span>
              <span className="font-mono text-[color:var(--text-muted)]">{Math.round(score.value)}</span>
            </div>
            <ProgressBar value={score.value} tone={toneFor(score.value)} />
          </div>
        ))}
      </div>
    </Card>
  );
}
