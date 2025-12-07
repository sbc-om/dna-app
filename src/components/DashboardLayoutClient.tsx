'use client';

import { ReactNode, useState, useEffect } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { PushNotificationInit } from '@/components/PushNotificationInit';
import { useNotificationFallback } from '@/lib/notifications/fallback';
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/styles/overlayscrollbars.css";

interface DashboardLayoutClientProps {
  children: ReactNode;
  dictionary: Dictionary;
  user: {
    email: string;
    fullName?: string;
    role?: string;
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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileSidebarOpen]);

  return (
    <div className="flex h-screen bg-[#DDDDDD] dark:bg-[#000000] overflow-hidden" dir={direction}>
      {/* Initialize Push Notifications (only on supported devices) */}
      {isPushSupported && <PushNotificationInit />}
      
      {/* Mobile Overlay with smooth fade */}
      {isMobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-in fade-in duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
          role="button"
          aria-label="Close menu"
        />
      )}

      <DashboardSidebar
        dictionary={dictionary}
        accessibleResources={accessibleResources}
        locale={locale}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden min-h-0 w-full">
        <DashboardHeader
          dictionary={dictionary}
          user={user}
          onMobileMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        <OverlayScrollbarsComponent
          element="main"
          className="flex-1 min-h-0 overscroll-y-contain pb-20 lg:pb-0"
          options={{ 
            scrollbars: { 
              autoHide: 'leave',
              theme: 'os-theme-dark'
            } 
          }}
          defer
        >
          {children}
        </OverlayScrollbarsComponent>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav locale={locale} userRole={user.role} />
      </div>
    </div>
  );
}
