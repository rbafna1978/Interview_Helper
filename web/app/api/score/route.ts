import { NextRequest, NextResponse } from 'next/server';
import { scoreAnswer } from '@/lib/scoring';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      transcript: string;
      question: string;
      durationSeconds: number;
      questionId?: string | null;
      history?: unknown[] | null;
    };

    const { transcript, question, durationSeconds, questionId, history } = body;

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'transcript is required' }, { status: 400 });
    }
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'question is required' }, { status: 400 });
    }

    const result = scoreAnswer(
      transcript.trim(),
      question.trim(),
      Number(durationSeconds) || 0,
      Array.isArray(history) ? history as Parameters<typeof scoreAnswer>[3] : null,
      questionId ?? null,
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/score]', err);
    return NextResponse.json({ error: 'Scoring failed' }, { status: 500 });
  }
}
