'use client';
import React from 'react';
import { useSession } from 'next-auth/react';

type SessionState = {
  user: { id: string; email?: string | null } | null;
  status: 'loading' | 'signed-in' | 'signed-out';
};

export const AuthCtx = React.createContext<SessionState>({
  user: null,
  status: 'loading',
});

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, status } = useSession();
  const value = React.useMemo<SessionState>(() => {
    if (status === 'loading') {
      return { user: null, status: 'loading' };
    }
    const user = data?.user ? { id: data.user.id, email: data.user.email } : null;
    return { user, status: user ? 'signed-in' : 'signed-out' };
  }, [data, status]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
