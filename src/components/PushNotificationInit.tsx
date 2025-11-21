'use client';

import { useEffect, useState } from 'react';
import { initializePushNotifications } from '@/lib/notifications/pushNotifications';

/**
 * Component to initialize push notifications on app load
 * This should be included in the root layout
 */
export function PushNotificationInit() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    // Initialize push notifications
    initializePushNotifications()
      .then((success) => {
        if (success) {
          console.log('Push notifications initialized successfully');
        }
        setInitialized(true);
      })
      .catch((error) => {
        console.error('Failed to initialize push notifications:', error);
        setInitialized(true);
      });
  }, [initialized]);

  // This component doesn't render anything
  return null;
}
