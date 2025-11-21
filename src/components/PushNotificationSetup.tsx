'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  isPushNotificationSupported,
  getNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getCurrentSubscription,
  sendSubscriptionToServer,
} from '@/lib/notifications/pushNotifications';

interface PushNotificationSetupProps {
  title?: string;
  description?: string;
  autoPrompt?: boolean;
}

export function PushNotificationSetup({
  title = 'Push Notifications',
  description = 'Stay updated with real-time message notifications',
  autoPrompt = false,
}: PushNotificationSetupProps) {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [browserInfo, setBrowserInfo] = useState<string>('');

  // Check support and permission on mount
  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);
    
    // Get browser info
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edge')) browser = 'Edge';
    setBrowserInfo(browser);
    
    checkSupport();
    checkSubscription();
    
    if (autoPrompt && permission === 'default' && !iOS) {
      // Auto-prompt after a short delay (only on supported platforms)
      const timer = setTimeout(() => {
        handleSubscribe();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [autoPrompt]);

  const checkSupport = () => {
    const supported = isPushNotificationSupported();
    setIsSupported(supported);
    
    if (supported) {
      const currentPermission = getNotificationPermission();
      setPermission(currentPermission);
    }
  };

  const checkSubscription = async () => {
    try {
      const subscription = await getCurrentSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const subscription = await subscribeToPushNotifications();
      
      if (!subscription) {
        setError('Failed to subscribe to notifications');
        setPermission(getNotificationPermission());
        return;
      }

      // Send subscription to server
      const success = await sendSubscriptionToServer(subscription);
      
      if (!success) {
        setError('Failed to save subscription on server');
        return;
      }

      setIsSubscribed(true);
      setPermission('granted');
    } catch (error) {
      console.error('Subscription error:', error);
      setError('Failed to enable notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await unsubscribeFromPushNotifications();
      
      if (success) {
        setIsSubscribed(false);
      } else {
        setError('Failed to unsubscribe');
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      setError('Failed to disable notifications');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <BellOff className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isIOS && (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <span className="text-2xl">📱</span>
                iOS/Safari Users
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                Apple Safari on iOS doesn't support web push notifications. Here are your options:
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <div>
                    <strong>Install as App:</strong> Add this website to your Home Screen for a better app-like experience
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <div>
                    <strong>Check Messages Page:</strong> Visit regularly to see new notifications and messages
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <div>
                    <strong>Use Another Device:</strong> Try Chrome or Firefox on Android/Desktop for full push notification support
                  </div>
                </li>
              </ul>
              
              <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded border border-blue-300 dark:border-blue-700">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">📲 How to Add to Home Screen:</p>
                <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                  <li>Tap the Share button <span className="inline-block bg-blue-100 dark:bg-blue-800 px-1.5 py-0.5 rounded text-xs font-mono">⎋</span> at the bottom</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to confirm</li>
                  <li>Open the app from your home screen</li>
                </ol>
              </div>
            </div>
          )}
          
          {!isIOS && (
            <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Detected Browser:</strong> {browserInfo}
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200 mt-2">
                Please try using a modern browser like <strong>Chrome</strong>, <strong>Firefox</strong>, or <strong>Edge</strong> for push notification support.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (permission === 'denied') {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <X className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>
            Notifications are blocked. Please enable them in your browser settings.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={isSubscribed ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSubscribed ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {title}
          {isSubscribed && (
            <Badge variant="outline" className="ml-auto bg-green-100 text-green-800 border-green-300">
              <Check className="h-3 w-3 mr-1" />
              Active
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          {!isSubscribed ? (
            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Bell className="mr-2 h-4 w-4" />
              {isLoading ? 'Enabling...' : 'Enable Notifications'}
            </Button>
          ) : (
            <Button
              onClick={handleUnsubscribe}
              disabled={isLoading}
              variant="outline"
            >
              <BellOff className="mr-2 h-4 w-4" />
              {isLoading ? 'Disabling...' : 'Disable Notifications'}
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>• Get notified instantly when you receive new messages</p>
          <p>• Works even when the app is closed</p>
          <p>• Available on mobile and desktop</p>
        </div>
      </CardContent>
    </Card>
  );
}
