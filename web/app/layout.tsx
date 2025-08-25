import './globals.css';
import type { Metadata } from 'next';
import AuthProvider from '@/components/AuthProvider';

export const metadata: Metadata = { title: 'Interview Coach', description: 'Practice with AI feedback' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}