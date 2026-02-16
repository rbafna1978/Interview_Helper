'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type Toast = {
  id: string;
  title: string;
  description?: string;
  tone?: 'success' | 'error' | 'info';
};

type ToastContextValue = {
  notify: (toast: Omit<Toast, 'id'>) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const notify = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed right-6 top-20 z-50 flex w-[320px] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm text-[color:var(--text)] shadow-[0_12px_30px_var(--shadow)]',
              toast.tone === 'success' && 'border-emerald-500/40',
              toast.tone === 'error' && 'border-rose-500/40'
            )}
          >
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.description && <p className="mt-1 text-xs text-[color:var(--text-muted)]">{toast.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
