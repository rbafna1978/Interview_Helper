import './globals.css';
import type { Metadata } from 'next';
import AuthProvider from '@/components/AuthProvider';
import { SessionProvider } from 'next-auth/react';
import { AppHeader } from '@/components/layout/AppHeader';
import { ToastProvider } from '@/components/ui/Toast';
import { IBM_Plex_Sans, Source_Serif_4 } from 'next/font/google';
import { ThemeScript } from '@/components/theme/ThemeScript';

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-plex',
  weight: ['400', '500', '600', '700'],
});
const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = { title: 'Interview Coach', description: 'Practice with AI feedback' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${plex.variable} ${serif.variable} antialiased`}>
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
