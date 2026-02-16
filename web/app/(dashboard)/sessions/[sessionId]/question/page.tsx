import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fetchSessionById } from '@/lib/data/sessions';
import { prisma } from '@/lib/prisma';
import SessionRecorderPanel from '@/components/session/SessionRecorderPanel';

type Props = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ slug?: string }>;
};

export default async function SessionQuestionPage({ params, searchParams }: Props) {
  const { sessionId } = await params;
  const { slug: questionSlug } = await searchParams;
  const session = await fetchSessionById(sessionId);
  if (!session) {
    notFound();
  }
  const question =
    (questionSlug && (await prisma.question.findUnique({ where: { slug: questionSlug } }))) ||
    (await prisma.question.findFirst({
      where: { mode: session.mode },
      orderBy: { createdAt: 'asc' },
    }));

  if (!question) {
    return (
      <PageContainer>
        <Card>
          <p className="text-sm text-[color:var(--text-muted)]">No questions available for this mode.</p>
          <Button asChild className="mt-4">
            <Link href="/question-bank">Browse question bank</Link>
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const slug = question.slug;

  return (
    <PageContainer className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--text-muted)]">Session #{sessionId.slice(0, 6)}</p>
        <h1 className="text-3xl font-semibold text-[color:var(--text)]">{question.prompt}</h1>
        <p className="text-sm text-[color:var(--text-muted)]">
          Mode: {session.mode} · Suggested time {question.timeLimitSec} seconds
        </p>
      </header>

      <Card className="space-y-4">
        <div className="flex items-center justify-between text-sm text-[color:var(--text-muted)]">
          <span>Timer target</span>
          <span>{Math.round(question.timeLimitSec / 60)} min</span>
        </div>
        <SessionRecorderPanel sessionId={session.id} questionSlug={slug} questionPrompt={question.prompt} />
      </Card>

      <div className="flex flex-wrap justify-end gap-3">
        <Button asChild variant="secondary">
          <Link href="/sessions">End session</Link>
        </Button>
        <Button asChild>
          <Link href={`/sessions/${session.id}/results?slug=${slug}`}>View latest results</Link>
        </Button>
      </div>
    </PageContainer>
  );
}
