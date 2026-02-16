import { cookies } from 'next/headers';
import { randomUUID, createHmac } from 'crypto';
import { env } from './env';

const COOKIE_NAME = 'guest_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 60; // 60 days

function sign(value: string) {
  const secret = env.GUEST_COOKIE_SECRET ?? env.NEXTAUTH_SECRET;
  if (!secret) return null;
  return createHmac('sha256', secret).update(value).digest('hex');
}

function buildToken(id: string) {
  const signature = sign(id);
  if (!signature) return null;
  return `${id}.${signature}`;
}

function parseToken(token: string | undefined | null) {
  if (!token) return null;
  const [id, signature] = token.split('.');
  if (!id || !signature) return null;
  const expected = sign(id);
  if (!expected) return null;
  return signature === expected ? id : null;
}

export async function getGuestId() {
  const store = await cookies();
  return parseToken(store.get(COOKIE_NAME)?.value);
}

export function buildGuestCookie() {
  const id = randomUUID();
  const token = buildToken(id);
  if (!token) return null;
  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    },
  };
}
