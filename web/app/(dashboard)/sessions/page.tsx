import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchRecentSessions } from '@/lib/data/sessions';
import { getViewer } from '@/lib/viewer';
import { prisma } from '@/lib/prisma';

export default async function SessionsPage() {
  const viewer = await getViewer();
  const sessions = await fetchRecentSessions({ userId: viewer.userId, guestId: viewer.guestId }, 20);
  const attemptPairs = await Promise.all(
    sessions.map(async (session) => {
      const attempts = await prisma.attempt.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: 'desc' },
        take: 2,
        include: { question: true },
      });
      return [session.id, attempts] as const;
    })
  );
  const attemptsBySession = new Map(attemptPairs);

  return (
    <PageContainer className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--text-muted)]">Sessions</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--text)]">Interview runs</h1>
        </div>
        <Button asChild>
          <Link href="/sessions/new">New session</Link>
        </Button>
      </header>

      {sessions.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          description="Kick off your first structured interview session."
          action={
            <Button asChild>
              <Link href="/sessions/new">Start session</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card key={session.id} className="space-y-4">
              <div>
                <p className="text-sm text-[color:var(--text-muted)]">Mode</p>
                <p className="text-lg font-semibold text-[color:var(--text)] capitalize">{session.mode}</p>
                <p className="text-xs text-[color:var(--text-muted)]">Started {new Date(session.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild variant="secondary">
                  <Link href={`/sessions/${session.id}/question`}>Open</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href={`/sessions/${session.id}/results`}>Results</Link>
                </Button>
                {attemptsBySession.get(session.id)?.[0]?.question?.slug && (
                  <Button asChild variant="ghost">
                    <Link href={`/sessions/${session.id}/question?slug=${attemptsBySession.get(session.id)?.[0]?.question?.slug}`}>
                      Reattempt
                    </Link>
                  </Button>
                )}
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text-muted)]">
                {(() => {
                  const attempts = attemptsBySession.get(session.id) ?? [];
                  const latest = attempts[0];
                  const previous = attempts[1];
                  if (!latest) {
                    return <p>No attempts yet. Record your first answer in this session.</p>;
                  }
                  const delta =
                    typeof previous?.scoreOverall === 'number' && typeof latest.scoreOverall === 'number'
                      ? latest.scoreOverall - previous.scoreOverall
                      : null;
                  return (
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">Latest attempt</p>
                        <p className="mt-2 text-base text-[color:var(--text)]">
                          {latest.question?.prompt.slice(0, 70) ?? 'Custom prompt'}
                          {latest.question?.prompt.length ? '…' : ''}
                        </p>
                        <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                          {new Date(latest.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">Score</p>
                        <p className="text-2xl font-semibold text-[color:var(--text)]">{latest.scoreOverall ?? 0}</p>
                        {delta !== null && (
                          <p className={`text-xs ${delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            Δ {delta >= 0 ? '+' : ''}{delta}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
