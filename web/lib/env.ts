import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(16, 'NEXTAUTH_SECRET must be at least 16 characters'),
  NEXT_PUBLIC_TRANSCRIBE_URL: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.coerce.number().optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  OTP_SALT: z.string().optional(),
  GUEST_COOKIE_SECRET: z.string().optional(),
});

const parsed = schema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXT_PUBLIC_TRANSCRIBE_URL: process.env.NEXT_PUBLIC_TRANSCRIBE_URL ?? 'http://127.0.0.1:8000',
  EMAIL_FROM: process.env.EMAIL_FROM ?? 'Interview Coach AI <no-reply@example.com>',
  EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
  EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
  EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,
  EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD,
  OTP_SALT: process.env.OTP_SALT,
  GUEST_COOKIE_SECRET: process.env.GUEST_COOKIE_SECRET ?? process.env.NEXTAUTH_SECRET,
});

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
