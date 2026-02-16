import argon2 from 'argon2';
import { randomInt } from 'crypto';
import { prisma } from '../prisma';
import { env } from '../env';

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;

function formatCode(code: number) {
  return code.toString().padStart(OTP_LENGTH, '0');
}

function salted(code: string) {
  const salt = env.OTP_SALT ?? env.NEXTAUTH_SECRET;
  return `${code}:${salt}`;
}

export async function issueOtp(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  const code = formatCode(randomInt(0, 10 ** OTP_LENGTH));
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.authOtp.updateMany({
    where: { email, usedAt: null },
    data: { usedAt: new Date() },
  });

  const codeHash = await argon2.hash(salted(code));
  await prisma.authOtp.create({
    data: {
      email,
      codeHash,
      expiresAt,
    },
  });

  return { email, code, expiresAt };
}

export async function verifyOtp(emailRaw: string, code: string) {
  const email = emailRaw.trim().toLowerCase();
  const current = await prisma.authOtp.findFirst({
    where: {
      email,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!current) return { valid: false };

  const isValid = await argon2.verify(current.codeHash, salted(code));
  if (!isValid) return { valid: false };

  await prisma.authOtp.update({
    where: { id: current.id },
    data: { usedAt: new Date() },
  });

  return { valid: true, email };
}
