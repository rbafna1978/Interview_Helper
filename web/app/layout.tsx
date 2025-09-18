import './globals.css';
import type { Metadata } from 'next';
import AuthProvider from '@/components/AuthProvider';

export const metadata: Metadata = { title: 'Interview Coach', description: 'Practice with AI feedback' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
