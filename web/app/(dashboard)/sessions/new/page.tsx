import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { prisma } from '@/lib/prisma';
import { getViewer } from '@/lib/viewer';

const packs = [
  { value: 'core', label: 'Core (default)', disabled: false },
  { value: 'company', label: 'Company packs (soon)', disabled: true },
];

async function startSession(formData: FormData) {
  'use server';
  const mode = (formData.get('mode') as string) || 'behavioral';
  const viewer = await getViewer();
  const question =
    (await prisma.question.findFirst({ where: { mode }, orderBy: { createdAt: 'asc' } })) ||
    (await prisma.question.findFirst({ orderBy: { createdAt: 'asc' } }));
  const session = await prisma.session.create({
    data: {
      mode,
      pack: formData.get('pack')?.toString() ?? null,
      userId: viewer.userId,
      guestId: viewer.userId ? null : viewer.guestId,
    },
  });
  const slug = question?.slug ?? 'challenge-star';
  redirect(`/sessions/${session.id}/question?slug=${slug}`);
}

export default async function SessionSetupPage({ searchParams }: { searchParams: { mode?: string } }) {
  const defaultMode = searchParams.mode ?? 'behavioral';

  return (
    <PageContainer className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--text-muted)]">Session setup</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--text)]">Select a mode</h1>
        <p className="text-sm text-[color:var(--text-muted)]">Pick a mode and start a structured interview flow.</p>
      </header>

      <Card>
        <form action={startSession} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[color:var(--text)]">Mode</label>
            <select
              name="mode"
              defaultValue={defaultMode}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text)] focus:outline-none"
            >
              <option value="behavioral">Behavioral</option>
              <option value="technical">Technical reasoning</option>
              <option value="system_design">System design</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[color:var(--text)]">Question pack</label>
            <select
              name="pack"
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text)] focus:outline-none"
            >
              {packs.map((pack) => (
                <option key={pack.value} value={pack.value} disabled={pack.disabled}>
                  {pack.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[color:var(--text-muted)]">Company-specific packs are coming soon.</p>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" asChild>
              <Link href="/dashboard">Cancel</Link>
            </Button>
            <Button type="submit">Start session</Button>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
}
