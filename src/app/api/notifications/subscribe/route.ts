import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth';
import { savePushSubscription } from '@/lib/db/repositories/pushSubscriptionRepository';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get subscription from request
    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Get user agent
    const userAgent = request.headers.get('user-agent') || undefined;

    // Save subscription
    const saved = await savePushSubscription(
      user.id,
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      userAgent
    );

    return NextResponse.json({
      success: true,
      subscription: saved,
    });
  } catch (error) {
    console.error('Failed to save push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}
