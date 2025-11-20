'use client';

import { ReactNode, useState } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Dictionary } from '@/lib/i18n/getDictionary';

interface DashboardLayoutClientProps {
  children: ReactNode;
  dictionary: Dictionary;
  user: {
    email: string;
    fullName?: string;
  };
  accessibleResources: string[];
  locale: string;
  direction: string;
}

export function DashboardLayoutClient({
  children,
  dictionary,
  user,
  accessibleResources,
  locale,
  direction
}: DashboardLayoutClientProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-950 dark:via-purple-950/30 dark:to-pink-950/30" dir={direction}>
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <DashboardSidebar
        dictionary={dictionary}
        accessibleResources={accessibleResources}
        locale={locale}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          dictionary={dictionary}
          user={user}
          onMobileMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
