import nodemailer from 'nodemailer';
import { env } from '@/lib/env';

type SendOtpPayload = {
  email: string;
  code: string;
  expiresAt: Date;
};

function smtpConfigured() {
  return Boolean(env.EMAIL_SERVER_HOST && env.EMAIL_SERVER_PORT && env.EMAIL_SERVER_USER && env.EMAIL_SERVER_PASSWORD);
}

export async function sendOtpEmail({ email, code, expiresAt }: SendOtpPayload) {
  if (!smtpConfigured()) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[OTP] ${email} -> ${code} (expires ${expiresAt.toISOString()})`);
    }
    return { delivered: false, reason: 'smtp_not_configured' };
  }

  const transporter = nodemailer.createTransport({
    host: env.EMAIL_SERVER_HOST,
    port: env.EMAIL_SERVER_PORT,
    secure: env.EMAIL_SERVER_PORT === 465,
    auth: {
      user: env.EMAIL_SERVER_USER,
      pass: env.EMAIL_SERVER_PASSWORD,
    },
  });

  const subject = 'Your Interview Coach login code';
  const text = `Your login code is ${code}. It expires at ${expiresAt.toLocaleTimeString()}.`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6;">
      <p>Your Interview Coach login code:</p>
      <p style="font-size: 22px; font-weight: 600; letter-spacing: 0.2em;">${code}</p>
      <p>This code expires at ${expiresAt.toLocaleTimeString()}.</p>
      <p style="color: #6b645a; font-size: 12px;">If you didn’t request this, you can ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: email,
    subject,
    text,
    html,
  });

  return { delivered: true };
}
