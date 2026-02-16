import { z } from 'zod';

function emptyToUndefined(value: string | undefined) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(16, 'NEXTAUTH_SECRET must be at least 16 characters'),
  EMAIL_FROM: z.string().min(1),
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.coerce.number().optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  OTP_SALT: z.string().optional(),
  GUEST_COOKIE_SECRET: z.string().optional(),
});

const parsed = schema.safeParse({
  DATABASE_URL: emptyToUndefined(process.env.DATABASE_URL),
  NEXTAUTH_URL: emptyToUndefined(process.env.NEXTAUTH_URL),
  NEXTAUTH_SECRET: emptyToUndefined(process.env.NEXTAUTH_SECRET),
  EMAIL_FROM: emptyToUndefined(process.env.EMAIL_FROM) ?? 'Interview Coach AI <no-reply@example.com>',
  EMAIL_SERVER_HOST: emptyToUndefined(process.env.EMAIL_SERVER_HOST),
  EMAIL_SERVER_PORT: emptyToUndefined(process.env.EMAIL_SERVER_PORT),
  EMAIL_SERVER_USER: emptyToUndefined(process.env.EMAIL_SERVER_USER),
  EMAIL_SERVER_PASSWORD: emptyToUndefined(process.env.EMAIL_SERVER_PASSWORD),
  OTP_SALT: emptyToUndefined(process.env.OTP_SALT),
  GUEST_COOKIE_SECRET: emptyToUndefined(process.env.GUEST_COOKIE_SECRET) ?? emptyToUndefined(process.env.NEXTAUTH_SECRET),
});

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

const data = parsed.data;

const smtpPieces = [data.EMAIL_SERVER_HOST, data.EMAIL_SERVER_PORT, data.EMAIL_SERVER_USER, data.EMAIL_SERVER_PASSWORD];
const smtpConfiguredCount = smtpPieces.filter(Boolean).length;
if (smtpConfiguredCount > 0 && smtpConfiguredCount < smtpPieces.length) {
  throw new Error('SMTP configuration is incomplete. Set all EMAIL_SERVER_* variables or leave all unset.');
}

const isProductionRuntime = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build';
if (isProductionRuntime) {
  if (!data.NEXTAUTH_URL) {
    throw new Error('NEXTAUTH_URL is required in production.');
  }
  if (data.NEXTAUTH_SECRET === 'set-a-32-byte-random-secret') {
    throw new Error('NEXTAUTH_SECRET must be changed from the example value in production.');
  }
}

export const env = data;
