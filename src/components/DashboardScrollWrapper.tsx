'use client';

import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { ReactNode } from 'react';

interface DashboardScrollWrapperProps {
  children: ReactNode;
}

export function DashboardScrollWrapper({ children }: DashboardScrollWrapperProps) {
  return (
    <OverlayScrollbarsComponent
      element="div"
      className="h-full bg-linear-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-blue-950/30 dark:to-purple-950/30"
      options={{
        scrollbars: {
          theme: 'os-theme-light',
          visibility: 'auto',
          autoHide: 'leave',
          autoHideDelay: 800,
        },
        overflow: {
          x: 'hidden',
          y: 'scroll'
        }
      }}
      defer
    >
      {children}
    </OverlayScrollbarsComponent>
  );
}
