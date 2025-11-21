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

  // Check support and permission on mount
  useEffect(() => {
    checkSupport();
    checkSubscription();
    
    if (autoPrompt && permission === 'default') {
      // Auto-prompt after a short delay
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
