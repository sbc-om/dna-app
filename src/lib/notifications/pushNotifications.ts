// Push Notification Utilities

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LQ-Bk99uxJKmZ2SRzW-4k7-BJpEHRxK0dHqLhUhE_F5XqM';

/**
 * Convert base64 VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Check current notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isPushNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission was previously denied');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker registered successfully:', registration);

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  try {
    // Request permission first
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    // Register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error('Service worker registration failed');
      return null;
    }

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('Already subscribed to push notifications');
      return subscription;
    }

    // Subscribe to push notifications
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
    });

    console.log('Subscribed to push notifications:', subscription);
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const successful = await subscription.unsubscribe();
      console.log('Unsubscribed from push notifications:', successful);
      return successful;
    }

    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

/**
 * Get current push subscription
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  try {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('Failed to get current subscription:', error);
    return null;
  }
}

/**
 * Show a local notification (for testing or fallback)
 */
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!isPushNotificationSupported()) {
    console.warn('Notifications are not supported');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      ...options,
    });
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
}

/**
 * Send subscription to server
 */
export async function sendSubscriptionToServer(
  subscription: PushSubscription
): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send subscription to server');
    }

    return true;
  } catch (error) {
    console.error('Failed to send subscription to server:', error);
    return false;
  }
}

/**
 * Initialize push notifications (call this on app load)
 */
export async function initializePushNotifications(): Promise<boolean> {
  try {
    if (!isPushNotificationSupported()) {
      console.warn('Push notifications are not supported');
      return false;
    }

    // Register service worker
    await registerServiceWorker();

    // Check if already subscribed
    const currentSubscription = await getCurrentSubscription();
    if (currentSubscription) {
      // Send to server
      await sendSubscriptionToServer(currentSubscription);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to initialize push notifications:', error);
    return false;
  }
}
