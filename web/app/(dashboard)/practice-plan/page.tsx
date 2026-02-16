import { PageContainer } from '@/components/layout/PageContainer';
import PracticePlanClient from '@/components/practice/PracticePlanClient';
import { getViewer } from '@/lib/viewer';

export default async function PracticePlanPage() {
  const viewer = await getViewer();
  return (
    <PageContainer className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--text-muted)]">Practice plan</p>
        <h1 className="text-3xl font-semibold text-[color:var(--text)]">Your 7-day focus</h1>
        <p className="text-sm text-[color:var(--text-muted)]">Short daily reps, tuned to your latest feedback.</p>
      </header>
      <PracticePlanClient isGuest={viewer.isGuest} />
    </PageContainer>
  );
}
