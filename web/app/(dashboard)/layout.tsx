import type { ReactNode } from 'react';
import { DashboardMobileNav, DashboardSidebar } from '@/components/layout/DashboardSidebar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <div className="hidden md:block md:w-64">
        <DashboardSidebar />
      </div>
      <div className="flex-1 bg-[color:var(--bg)] pb-24 md:pb-0">
        {children}
      </div>
      <DashboardMobileNav />
    </div>
  );
}
