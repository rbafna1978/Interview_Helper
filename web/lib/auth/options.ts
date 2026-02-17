import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import argon2 from 'argon2';
import { prisma } from '../prisma';
import { verifyOtp } from './otp';

function getString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export const authOptions: NextAuthConfig = {
  // NextAuth v5 reads AUTH_SECRET by default; explicitly pass NEXTAUTH_SECRET so
  // either env var name works in deployment.
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      id: 'otp',
      name: 'Email OTP',
      credentials: {
        email: { label: 'Email', type: 'email' },
        code: { label: 'Code', type: 'text' },
      },
      async authorize(credentials) {
        const email = getString(credentials?.email)?.toLowerCase().trim();
        const code = getString(credentials?.code)?.trim();
        if (!email || !code) return null;
        const result = await verifyOtp(email, code);
        if (!result.valid) return null;
        const user = await prisma.user.upsert({
          where: { email },
          create: { email },
          update: {},
        });
        return { id: user.id, email: user.email };
      },
    }),
    Credentials({
      id: 'password',
      name: 'Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = getString(credentials?.email)?.toLowerCase().trim();
        const password = getString(credentials?.password);
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        const valid = await argon2.verify(user.passwordHash, password);
        if (!valid) return null;
        return { id: user.id, email: user.email };
      },
    }),
  ],
  pages: {
    signIn: '/auth',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
  },
};
