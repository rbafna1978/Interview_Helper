'use client';
import React from 'react';
import { supabase } from '@/lib/supabase/client';

type SessionState = {
  user: { id: string; email?: string | null } | null;
  status: 'loading' | 'signed-in' | 'signed-out';
};

export const AuthCtx = React.createContext<SessionState>({
  user: null,
  status: 'loading',
});

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<SessionState>({ user: null, status: 'loading' });

  React.useEffect(() => {
    if (!supabase) {
      setState({ user: null, status: 'signed-out' });
      return;
    }

    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const u = data.user;
      setState({ user: u ? { id: u.id, email: u.email } : null, status: u ? 'signed-in' : 'signed-out' });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      setState({ user: u ? { id: u.id, email: u.email } : null, status: u ? 'signed-in' : 'signed-out' });
    });

    return () => {
      active = false;
      sub?.subscription.unsubscribe();
    };
  }, []);

  return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>;
}
