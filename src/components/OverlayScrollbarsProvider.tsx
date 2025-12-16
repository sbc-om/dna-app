'use client';

import { useEffect } from 'react';
import { OverlayScrollbars } from 'overlayscrollbars';
import 'overlayscrollbars/overlayscrollbars.css';

export function OverlayScrollbarsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize OverlayScrollbars on body
    const instance = OverlayScrollbars(document.body, {
      scrollbars: {
        theme: 'os-theme-dark',
        visibility: 'auto',
        autoHide: 'move',
        autoHideDelay: 800,
        dragScroll: true,
        clickScroll: false,
        pointers: ['mouse', 'touch', 'pen'],
      },
      overflow: {
        x: 'hidden',
        y: 'scroll',
      },
    });

    return () => {
      instance.destroy();
    };
  }, []);

  return <>{children}</>;
}
