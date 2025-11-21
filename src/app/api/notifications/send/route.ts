import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth';
import webpush from 'web-push';
import { getUserSubscriptions } from '@/lib/db/repositories/pushSubscriptionRepository';

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LQ-Bk99uxJKmZ2SRzW-4k7-BJpEHRxK0dHqLhUhE_F5XqM';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 
  'TF5f2gLOEzF1HqVsEJ1KuF0Q6AZYYsWF7L2SxFXzTjo';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@dna-app.com';

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export async function POST(request: NextRequest) {
  try {
    // Only authenticated users can send notifications
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get notification data
    const body = await request.json();
    const { userId, title, message, url, icon, badge, tag } = body;

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user's subscriptions
    const subscriptions = await getUserSubscriptions(userId);

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: 'No subscriptions found for user',
      });
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title,
      body: message,
      icon: icon || '/icons/icon-192x192.png',
      badge: badge || '/icons/icon-96x96.png',
      tag: tag || 'notification',
      data: {
        url: url || '/dashboard/messages',
        timestamp: Date.now(),
      },
    });

    // Send to all user's subscriptions
    const results = await Promise.allSettled(
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
            payload
          );
          return { success: true, subscriptionId: sub.id };
        } catch (error) {
          console.error(`Failed to send to subscription ${sub.id}:`, error);
          return { success: false, subscriptionId: sub.id, error };
        }
      })
    );

    const successCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;

    return NextResponse.json({
      success: true,
      sent: successCount,
      total: subscriptions.length,
    });
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
