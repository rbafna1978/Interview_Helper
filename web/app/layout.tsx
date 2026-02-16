import './globals.css';
import type { Metadata } from 'next';
import AuthProvider from '@/components/AuthProvider';
import { SessionProvider } from 'next-auth/react';
import { AppHeader } from '@/components/layout/AppHeader';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeScript } from '@/components/theme/ThemeScript';

export const metadata: Metadata = { title: 'Interview Coach', description: 'Practice with AI feedback' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="antialiased">
        <SessionProvider>
          <AuthProvider>
            <ToastProvider>
              <div className="min-h-screen bg-[color:var(--bg)]">
                <AppHeader />
                {children}
              </div>
            </ToastProvider>
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
