import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchRecentSessions } from '@/lib/data/sessions';
import { prisma } from '@/lib/prisma';
import { getViewer } from '@/lib/viewer';

const modes = [
  { id: 'behavioral', emoji: '🎤', title: 'Behavioral', description: 'STAR practice with curated prompts.' },
  { id: 'technical', emoji: '💻', title: 'Technical', description: 'Explain approaches and trade-offs verbally.' },
  { id: 'system_design', emoji: '🏗️', title: 'System design', description: 'Talk through architectures out loud.' },
];

function scoreColor(score: number) {
  if (score >= 75) return '#16a34a';
  if (score >= 55) return '#d97706';
  return '#dc2626';
}

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
  const completedTasks = practicePlan?.tasks.filter((t) => t.isDone).length ?? 0;
  const totalTasks = practicePlan?.tasks.length ?? 0;

  return (
    <PageContainer className="space-y-10">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="font-serif text-3xl font-bold text-[color:var(--text)]">
          {hasHistory ? 'Keep the momentum going' : 'Ready for your first rep?'}
        </h1>
        <p className="text-sm text-[color:var(--text-muted)]">
          {viewer.isGuest
            ? 'Guest sessions stay on this device. Sign in to save your history.'
            : `Signed in as ${viewer.email ?? 'member'}.`}
        </p>
      </header>

      {/* Resume + Practice plan */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[color:var(--text-muted)]">Resume practice</p>
              <h2 className="font-serif text-xl font-semibold text-[color:var(--text)]">
                {resumeSession ? `${resumeSession.mode.charAt(0).toUpperCase() + resumeSession.mode.slice(1)} session` : 'No active session'}
              </h2>
            </div>
            <Button asChild variant={resumeSession ? 'primary' : 'secondary'}>
              <Link href={resumeSession ? `/sessions/${resumeSession.id}/question` : '/sessions/new'}>
                {resumeSession ? 'Open session' : 'Start session'}
              </Link>
            </Button>
          </div>
          {resumeSession ? (
            <div className="flex flex-wrap gap-6 rounded-xl bg-[color:var(--surface-muted)] px-4 py-3 text-sm">
              <div>
                <p className="text-xs text-[color:var(--text-muted)]">Mode</p>
                <p className="font-medium text-[color:var(--text)]">{resumeSession.mode}</p>
              </div>
              <div>
                <p className="text-xs text-[color:var(--text-muted)]">Started</p>
                <p className="font-medium text-[color:var(--text)]">{new Date(resumeSession.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-[color:var(--text-muted)]">Status</p>
                <p className="font-medium text-[color:var(--text)]">In progress</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[color:var(--text-muted)]">Jump into your first session using the modes below.</p>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <div>
            <p className="text-sm text-[color:var(--text-muted)]">Practice plan</p>
          </div>
          {viewer.isGuest ? (
            <>
              <p className="text-base text-[color:var(--text)]">Sign in to track your 7-day practice plan.</p>
              <Button asChild variant="secondary" className="mt-auto w-full">
                <Link href="/auth">Sign in to track tasks</Link>
              </Button>
            </>
          ) : practicePlan ? (
            <>
              <p className="font-serif text-2xl font-bold text-[color:var(--text)]">
                {completedTasks}/{totalTasks}
              </p>
              <p className="text-sm text-[color:var(--text-muted)]">
                tasks done — {completedTasks === 0 ? 'let\'s get started' : completedTasks === totalTasks ? 'plan complete!' : 'you\'re building momentum'}
              </p>
              <div className="h-1.5 w-full rounded-full bg-[color:var(--surface-muted)]">
                <div
                  className="h-1.5 rounded-full bg-[color:var(--accent)] transition-all"
                  style={{ width: totalTasks ? `${(completedTasks / totalTasks) * 100}%` : '0%' }}
                />
              </div>
              <Button asChild variant="secondary" className="mt-auto w-full">
                <Link href="/practice-plan">View practice plan</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-base text-[color:var(--text)]">Your next attempt will generate a personalised plan.</p>
              <Button asChild variant="secondary" className="mt-auto w-full">
                <Link href="/sessions/new">Start practice</Link>
              </Button>
            </>
          )}
        </Card>
      </section>

      {/* Start a new session */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-[color:var(--text)]">Start a new session</h2>
          <Link href="/sessions/new" className="text-sm text-[color:var(--accent)] underline-offset-4 hover:underline">
            Advanced setup
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {modes.map((mode) => (
            <Card key={mode.id} className="flex flex-col gap-3 hover:shadow-sm transition">
              <div className="text-2xl">{mode.emoji}</div>
              <p className="font-serif font-semibold text-[color:var(--text)]">{mode.title}</p>
              <p className="text-sm text-[color:var(--text-muted)]">{mode.description}</p>
              <Button asChild className="mt-auto">
                <Link href={`/sessions/new?mode=${mode.id}`}>Start {mode.title}</Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent attempts */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-[color:var(--text)]">Recent attempts</h2>
          <Link href="/sessions" className="text-sm text-[color:var(--accent)] underline-offset-4 hover:underline">
            View all
          </Link>
        </div>
        {recentAttempts.length === 0 ? (
          <EmptyState
            title={hasHistory ? 'Attempts are processing' : 'No attempts yet'}
            description={hasHistory ? 'Recorded answers will appear here soon.' : 'Start a session to generate your first attempt.'}
            action={
              <Button asChild>
                <Link href="/sessions/new">Start your first interview</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3">
            {recentAttempts.map((attempt) => {
              const score = attempt.scoreOverall ?? 0;
              const color = scoreColor(score);
              return (
                <Card key={attempt.id} className="flex items-center gap-4 hover:shadow-sm transition">
                  {/* Score badge */}
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {score > 0 ? Math.round(score) : '—'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[color:var(--text)]">
                      {attempt.question?.prompt.slice(0, 70) ?? 'Custom prompt'}
                      {(attempt.question?.prompt.length ?? 0) > 70 ? '…' : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                      {new Date(attempt.createdAt).toLocaleDateString()} · {attempt.session.mode}
                    </p>
                  </div>
                  <Button asChild variant="ghost" className="shrink-0 text-xs">
                    <Link href={`/sessions/${attempt.sessionId}/results?attempt=${attempt.id}`}>Review</Link>
                  </Button>
                </Card>
              );
            })}
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
