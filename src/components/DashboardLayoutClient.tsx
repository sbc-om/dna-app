'use client';

import { ReactNode, useState, useEffect } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { PushNotificationInit } from '@/components/PushNotificationInit';
import { useNotificationFallback } from '@/lib/notifications/fallback';

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
  const [isPushSupported, setIsPushSupported] = useState(true);

  // Check if push notifications are supported
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsPushSupported(supported);
  }, []);

  // Use fallback polling for devices without push notification support (like iOS)
  useNotificationFallback(!isPushSupported);

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-950 dark:via-purple-950/30 dark:to-pink-950/30" dir={direction}>
      {/* Initialize Push Notifications (only on supported devices) */}
      {isPushSupported && <PushNotificationInit />}
      
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

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
