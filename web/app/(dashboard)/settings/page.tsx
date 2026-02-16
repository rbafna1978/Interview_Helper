import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getViewer } from '@/lib/viewer';

export default async function SettingsPage() {
  const viewer = await getViewer();

  return (
    <PageContainer className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--text-muted)]">Settings</p>
        <h1 className="text-3xl font-semibold text-[color:var(--text)]">Account & privacy</h1>
      </header>

      <Card className="space-y-3">
        <p className="text-sm text-[color:var(--text-muted)]">Signed in as</p>
        <p className="text-lg text-[color:var(--text)]">{viewer.email ?? 'Guest session'}</p>
        <Button variant="secondary" disabled={!viewer.userId}>
          {viewer.userId ? 'Sign out (via /auth)' : 'Guest mode active'}
        </Button>
      </Card>
    </PageContainer>
  );
}
