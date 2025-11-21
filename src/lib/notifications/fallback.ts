'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Fallback notification system for devices that don't support Push Notifications (like iOS Safari)
 * Uses polling to check for new messages periodically
 */
export function useNotificationFallback(enabled: boolean = true) {
  const router = useRouter();

  const checkForNewMessages = useCallback(async () => {
    try {
      // Check if user is authenticated
      const response = await fetch('/api/auth/me');
      if (!response.ok) return;

      // Get unread message count
      const unreadResponse = await fetch('/api/messages/unread-count');
      if (!unreadResponse.ok) return;

      const data = await unreadResponse.json();
      
      if (data.count > 0) {
        // Show browser notification if available (even without service worker)
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('New Message', {
              body: `You have ${data.count} new message${data.count > 1 ? 's' : ''}`,
              icon: '/icons/icon-192x192.png',
              tag: 'new-messages',
            });
          } catch (e) {
            console.log('Basic notification not available');
          }
        }
        
        // Update page title with unread count
        if (typeof document !== 'undefined') {
          document.title = `(${data.count}) DNA Program`;
        }
      } else {
        // Reset title when no unread messages
        if (typeof document !== 'undefined' && document.title.startsWith('(')) {
          document.title = 'DNA Program';
        }
      }
    } catch (error) {
      console.error('Error checking for new messages:', error);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Check immediately on mount
    checkForNewMessages();

    // Set up polling interval (every 30 seconds)
    const interval = setInterval(checkForNewMessages, 30000);

    // Also check when page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForNewMessages();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, checkForNewMessages]);

  return { checkForNewMessages };
}
