import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type AttemptPayload = {
  sessionId: string;
  questionSlug?: string;
  transcript: string;
  durationSeconds?: number;
  overallScore?: number | null;
  subscores?: Record<string, number> | null;
  scores?: Record<string, number | string | null> | null;
  issues?: unknown[];
  explain?: unknown;
  suggestions?: string[];
  strengths?: string[];
  detected?: unknown;
  explanations?: unknown;
  questionAlignment?: unknown;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as AttemptPayload;
    if (!payload.sessionId) {
      return NextResponse.json({ ok: false, error: 'Missing sessionId' }, { status: 400 });
    }

    const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Session not found' }, { status: 404 });
    }

    const question = payload.questionSlug
      ? await prisma.question.findUnique({ where: { slug: payload.questionSlug } })
      : null;

    const scoreOverall =
      typeof payload.overallScore === 'number'
        ? Math.round(payload.overallScore)
        : typeof payload.scores?.total === 'number'
          ? Math.round(payload.scores.total)
          : 0;

    const attempt = await prisma.attempt.create({
      data: {
        sessionId: payload.sessionId,
        questionId: question?.id ?? null,
        transcript: payload.transcript,
        transcriptJson: null,
        feedbackJson: JSON.stringify({
          overallScore: payload.overallScore ?? null,
          subscores: payload.subscores ?? null,
          issues: payload.issues ?? [],
          explain: payload.explain ?? null,
          suggestions: payload.suggestions ?? [],
          strengths: payload.strengths ?? [],
          detected: payload.detected ?? null,
          explanations: payload.explanations ?? null,
          question_alignment: payload.questionAlignment ?? null,
        }),
        scoreOverall,
        scoreBreakdownJson: JSON.stringify(payload.subscores ?? payload.scores ?? {}),
        status: 'SCORED',
      },
    });

    const sessionUserId = session.userId;
    if (sessionUserId) {
      const existingPlan = await prisma.practicePlan.findFirst({
        where: {
          userId: sessionUserId,
          startDate: { gt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) },
        },
        include: { tasks: true },
      });
      if (!existingPlan) {
        const weaknesses = Array.isArray(payload.issues) ? payload.issues.slice(0, 3) : [];
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        const fallbackTasks = [
          { title: 'Record a 90-second STAR response', details: 'Pick a recent project and hit Situation → Task → Action → Result.' },
          { title: 'Tighten your opener', details: 'Draft a 2-sentence intro that states the outcome first.' },
          { title: 'Cut filler words', details: 'Do one take with a strict 2-second pause instead of “um/like”.' },
          { title: 'Answer a new prompt', details: 'Use the question bank to practice a different competency.' },
          { title: 'Review transcript highlights', details: 'Rewrite the most rambly section in 3 bullet points.' },
          { title: 'Time-box the answer', details: 'Aim for 2 minutes max and stop when you hit the result.' },
          { title: 'Repeat the same question', details: 'Do a second take with the top fixes applied.' },
        ];
        const taskSeed = weaknesses.map((issue: any) => ({
          title: issue.fixSuggestion || 'Refine your interview structure',
          details: issue.evidenceSnippet || null,
        }));
        const taskList = [...taskSeed, ...fallbackTasks].slice(0, 7);
        const plan = await prisma.practicePlan.create({
          data: {
            userId: sessionUserId,
            startDate,
            endDate,
            tasks: {
              create: taskList.map((task, index) => ({
                title: task.title,
                details: task.details ?? null,
                dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * (index + 1)),
              })),
            },
          },
          include: { tasks: true },
        });
        return NextResponse.json({ ok: true, attemptId: attempt.id, planId: plan.id });
      }
    }

    return NextResponse.json({ ok: true, attemptId: attempt.id });
  } catch (error) {
    console.error('POST /api/attempts failed', error);
    return NextResponse.json({ ok: false, error: 'Failed to save attempt' }, { status: 500 });
  }
}
