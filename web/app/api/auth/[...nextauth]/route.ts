import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/options';

const { handlers, auth } = NextAuth(authOptions);

export { auth };
export const GET = handlers.GET;
export const POST = handlers.POST;
