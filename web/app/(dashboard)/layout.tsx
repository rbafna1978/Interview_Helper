import type { ReactNode } from 'react';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <div className="hidden md:block md:w-64">
        <DashboardSidebar />
      </div>
      <div className="flex-1 bg-[color:var(--bg)]">
        <div className="md:hidden">
          <DashboardSidebar />
        </div>
        {children}
      </div>
    </div>
  );
}
