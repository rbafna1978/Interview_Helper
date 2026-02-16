import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchRecentSessions } from '@/lib/data/sessions';
import { prisma } from '@/lib/prisma';
import { getViewer } from '@/lib/viewer';

const modes = [
  { id: 'behavioral', title: 'Behavioral', description: 'STAR practice with curated prompts.' },
  { id: 'technical', title: 'Technical reasoning', description: 'Explain approaches verbally.' },
  { id: 'system_design', title: 'System design', description: 'Talk through architectures out loud.' },
];

export default async function DashboardPage() {
  const viewer = await getViewer();
  const sessions = await fetchRecentSessions({ userId: viewer.userId, guestId: viewer.guestId }, 4);
  const recentAttempts = await prisma.attempt.findMany({
    where: viewer.userId
      ? { session: { userId: viewer.userId } }
      : viewer.guestId
        ? { session: { userId: null, guestId: viewer.guestId } }
        : { session: { userId: null, guestId: null } },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { question: true, session: true },
  });
  const practicePlan = viewer.userId
    ? await prisma.practicePlan.findFirst({
        where: { userId: viewer.userId },
        orderBy: { startDate: 'desc' },
        include: { tasks: true },
      })
    : null;

  const hasHistory = sessions.length > 0 || recentAttempts.length > 0;
  const resumeSession = sessions[0];
  const completedTasks = practicePlan?.tasks.filter((task) => task.isDone).length ?? 0;
  const totalTasks = practicePlan?.tasks.length ?? 0;

  return (
    <PageContainer className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--text-muted)]">Welcome back</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--text)]">Your interview workspace</h1>
        <p className="text-sm text-[color:var(--text-muted)]">
          {viewer.isGuest ? 'Guest sessions stay on this device.' : `Signed in as ${viewer.email ?? 'member'}.`}
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[color:var(--text-muted)]">Resume practice</p>
              <h2 className="text-xl font-semibold text-[color:var(--text)]">
                {resumeSession ? `Session in ${resumeSession.mode}` : 'No active session'}
              </h2>
            </div>
            <Button asChild variant={resumeSession ? 'primary' : 'secondary'}>
              <Link href={resumeSession ? `/sessions/${resumeSession.id}/question` : '/sessions/new'}>
                {resumeSession ? 'Open session' : 'Start session'}
              </Link>
            </Button>
          </div>
          {resumeSession ? (
            <dl className="mt-6 grid gap-4 text-sm text-[color:var(--text-muted)] md:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-[0.4em]">Mode</dt>
                <dd className="text-base text-[color:var(--text)]">{resumeSession.mode}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.4em]">Started</dt>
                <dd>{new Date(resumeSession.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.4em]">Status</dt>
                <dd>In progress</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-[color:var(--text-muted)]">No session yet—jump into your first run below.</p>
          )}
        </Card>

        <Card>
          <p className="text-sm text-[color:var(--text-muted)]">Practice plan</p>
          {viewer.isGuest ? (
            <>
              <p className="mt-2 text-base text-[color:var(--text)]">Sign in to save and track your 7-day practice plan.</p>
              <Button asChild variant="secondary" className="mt-4 w-full">
                <Link href="/auth">Sign in to track tasks</Link>
              </Button>
            </>
          ) : practicePlan ? (
            <>
              <p className="mt-2 text-base text-[color:var(--text)]">
                {completedTasks}/{totalTasks} tasks complete · Week of {new Date(practicePlan.startDate).toLocaleDateString()}
              </p>
              <Button asChild variant="secondary" className="mt-4 w-full">
                <Link href="/practice-plan">View practice plan</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="mt-2 text-base text-[color:var(--text)]">Your next attempt will generate a plan.</p>
              <Button asChild variant="secondary" className="mt-4 w-full">
                <Link href="/sessions/new">Start practice</Link>
              </Button>
            </>
          )}
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[color:var(--text)]">Start a new session</h2>
          <Link href="/sessions/new" className="text-sm text-[color:var(--accent)] underline-offset-4 hover:underline">
            Advanced setup
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {modes.map((mode) => (
            <Card key={mode.id} className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-[color:var(--text)]">{mode.title}</p>
              <p className="text-sm text-[color:var(--text-muted)]">{mode.description}</p>
              <Button asChild>
                <Link href={`/sessions/new?mode=${mode.id}`}>Start {mode.title}</Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[color:var(--text)]">Recent attempts</h2>
          <Link href="/sessions" className="text-sm text-[color:var(--accent)] underline-offset-4 hover:underline">
            View all
          </Link>
        </div>
        {recentAttempts.length === 0 ? (
          <EmptyState
            title={hasHistory ? 'Attempts are processing' : 'No attempts yet'}
            description={
              hasHistory ? 'Recorded answers will appear here soon.' : 'Start a session to generate your first attempt.'
            }
            action={
              <Button asChild>
                <Link href="/sessions/new">Start your first interview</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4">
            {recentAttempts.map((attempt) => (
              <Card key={attempt.id} className="flex flex-col gap-2 text-sm text-[color:var(--text-muted)]">
                <div className="flex flex-wrap items-center justify-between">
                  <p className="font-medium text-[color:var(--text)]">
                    {attempt.question?.prompt.slice(0, 60) ?? 'Custom prompt'}
                    {attempt.question?.prompt.length ? '…' : ''}
                  </p>
                  <span className="text-xs text-[color:var(--text-muted)]">
                    {new Date(attempt.createdAt).toLocaleDateString()} · {attempt.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-[color:var(--text-muted)]">
                  <span>Score: {attempt.scoreOverall ?? '—'}</span>
                  <span>Session: {attempt.sessionId.slice(0, 6)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {!hasHistory && (
        <section>
          <EmptyState
            title="You're all set to start"
            description="Pick a mode above and record a 2-minute answer to get targeted feedback."
            action={
              <Button asChild>
                <Link href="/sessions/new">Start your first interview</Link>
              </Button>
            }
          />
        </section>
      )}
    </PageContainer>
  );
}
