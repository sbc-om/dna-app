import webpush from 'web-push';
import { getUserSubscriptions } from '@/lib/db/repositories/pushSubscriptionRepository';
import { createNotification } from '@/lib/db/repositories/notificationRepository';

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@dna-app.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
  category?: 'all' | 'system' | 'appointments' | 'users' | 'messages';
}

/**
 * Send push notification to a user
 */
export async function sendNotification(
  userId: string,
  payload: NotificationPayload
): Promise<{ sent: number; failed: number }> {
  try {
    // 1. Save to Database
    await createNotification({
      userId,
      title: payload.title,
      message: payload.body,
      type: payload.type || 'info',
      category: payload.category || 'system',
      actionUrl: payload.url,
    });

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.warn('VAPID keys not configured. Push notifications disabled.');
      return { sent: 0, failed: 0 };
    }

    // Get user's subscriptions
    const subscriptions = await getUserSubscriptions(userId);

    if (subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return { sent: 0, failed: 0 };
    }

    // Prepare notification payload
    const notificationData = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-96x96.png',
      tag: payload.tag || 'notification',
      requireInteraction: payload.requireInteraction || false,
      data: {
        url: payload.url || '/dashboard/messages',
        timestamp: Date.now(),
      },
    });

    // Send to all user's subscriptions
    let sent = 0;
    let failed = 0;

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth,
              },
            },
            notificationData
          );
          sent++;
          console.log(`Push notification sent to subscription ${sub.id}`);
        } catch (error: any) {
          failed++;
          console.error(`Failed to send to subscription ${sub.id}:`, error?.message || error);
          
          // If subscription is no longer valid (410 Gone), we should remove it
          if (error?.statusCode === 410 || error?.statusCode === 404) {
            console.log(`Subscription ${sub.id} is no longer valid, should be removed`);
            // TODO: Remove invalid subscription from database
          }
        }
      })
    );

    console.log(`Push notification results: ${sent} sent, ${failed} failed (user: ${userId})`);
    return { sent, failed };
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendNotificationToUsers(
  userIds: string[],
  payload: NotificationPayload
): Promise<{ sent: number; failed: number }> {
  let totalSent = 0;
  let totalFailed = 0;

  await Promise.all(
    userIds.map(async (userId) => {
      const result = await sendNotification(userId, payload);
      totalSent += result.sent;
      totalFailed += result.failed;
    })
  );

  return { sent: totalSent, failed: totalFailed };
}
