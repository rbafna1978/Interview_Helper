import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'guest_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 60;

async function hmacHex(value: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function isValidToken(token: string, secret: string) {
  const [id, signature] = token.split('.');
  if (!id || !signature) return false;
  const expected = await hmacHex(id, secret);
  return expected === signature;
}

export async function middleware(req: NextRequest) {
  const secret = process.env.GUEST_COOKIE_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (token && (await isValidToken(token, secret))) {
    return NextResponse.next();
  }

  const id = crypto.randomUUID();
  const signature = await hmacHex(id, secret);
  const response = NextResponse.next();
  response.cookies.set(COOKIE_NAME, `${id}.${signature}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
