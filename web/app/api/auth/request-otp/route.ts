import { NextResponse } from 'next/server';
import { issueOtp } from '@/lib/auth/otp';
import { sendOtpEmail } from '@/lib/email';

const rateBucket = new Map<string, number[]>();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 5;

function allowRequest(key: string) {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const existing = rateBucket.get(key) ?? [];
  const recent = existing.filter((stamp) => stamp > windowStart);
  if (recent.length >= MAX_REQUESTS) {
    rateBucket.set(key, recent);
    return false;
  }
  recent.push(now);
  rateBucket.set(key, recent);
  return true;
}

export async function POST(request: Request) {
  const { email } = await request.json().catch(() => ({ email: '' }));
  const normalized = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const key = `${ip}:${normalized}`;

  if (!normalized) {
    return NextResponse.json({ ok: true });
  }
  if (!allowRequest(key)) {
    return NextResponse.json({ ok: true }, { status: 429 });
  }

  const otp = await issueOtp(normalized);
  await sendOtpEmail(otp);

  return NextResponse.json({ ok: true });
}
