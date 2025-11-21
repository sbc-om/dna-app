# Push Notifications Guide

This document explains how to set up and use push notifications in the DNA Web App.

## Overview

The push notification system allows users to receive real-time notifications when they receive new messages, even when the app is closed or in the background.

## Features

- ✅ Real-time push notifications for new messages
- ✅ Works on desktop and mobile browsers
- ✅ Background notifications (even when app is closed)
- ✅ Customizable notification settings
- ✅ Auto-subscribe on login
- ✅ Multiple device support
- ✅ Offline support with service worker

## Architecture

### Components

1. **Service Worker** (`/public/sw.js`)
   - Handles push events
   - Shows notifications
   - Manages click events
   - Caches app for offline use

2. **Push Notification Utilities** (`/src/lib/notifications/pushNotifications.ts`)
   - Browser API wrappers
   - Subscription management
   - Permission handling

3. **Push Subscription Repository** (`/src/lib/db/repositories/pushSubscriptionRepository.ts`)
   - Stores user subscriptions in LMDB
   - Manages multiple devices per user

4. **API Routes**
   - `/api/notifications/subscribe` - Save subscription
   - `/api/notifications/send` - Send push notification

5. **UI Components**
   - `PushNotificationSetup` - Settings UI
   - `PushNotificationInit` - Auto-initialization

## Setup

### 1. Generate VAPID Keys

VAPID keys are required for web push. Generate new keys:

```bash
npx web-push generate-vapid-keys
```

### 2. Configure Environment Variables

Add the generated keys to `.env.local`:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:your-email@example.com
```

### 3. Enable HTTPS (Production)

Push notifications require HTTPS in production (localhost works without HTTPS).

## Usage

### For Users

1. **Enable Notifications**
   - Go to Settings → Notifications tab
   - Click "Enable Notifications"
   - Allow browser permission when prompted

2. **Receive Notifications**
   - When someone sends you a message, you'll receive a push notification
   - Works even when the app is closed
   - Click notification to open the message

3. **Disable Notifications**
   - Go to Settings → Notifications tab
   - Click "Disable Notifications"

### For Developers

#### Send a Push Notification

```typescript
import { sendPushNotification } from '@/lib/actions/messageActions';

await sendPushNotification(
  userId,
  'New Message',
  'You have a new message from John',
  '/dashboard/messages'
);
```

#### Check Notification Support

```typescript
import { isPushNotificationSupported } from '@/lib/notifications/pushNotifications';

if (isPushNotificationSupported()) {
  // Enable notification features
}
```

#### Subscribe User

```typescript
import { subscribeToPushNotifications } from '@/lib/notifications/pushNotifications';

const subscription = await subscribeToPushNotifications();
if (subscription) {
  // User is subscribed
}
```

## How It Works

### Flow Diagram

```
User Opens App
    ↓
PushNotificationInit Component
    ↓
Register Service Worker
    ↓
Check Existing Subscription
    ↓
Send Subscription to Server (/api/notifications/subscribe)
    ↓
Save in LMDB (pushSubscriptionRepository)

---

User Receives Message
    ↓
sendMessageAction (messageActions.ts)
    ↓
Call /api/notifications/send
    ↓
Get User's Subscriptions
    ↓
Send Push via web-push library
    ↓
Service Worker Receives Push Event
    ↓
Show Notification
    ↓
User Clicks Notification
    ↓
Open App at /dashboard/messages
```

## Browser Support

| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome | ✅ | ✅ | Full support |
| Firefox | ✅ | ✅ | Full support |
| Safari | ✅ (16.4+) | ✅ (16.4+) | iOS 16.4+ only |
| Edge | ✅ | ✅ | Full support |
| Opera | ✅ | ✅ | Full support |

## Testing

### Test on Localhost

1. Start dev server: `npm run dev`
2. Open browser at `http://localhost:3000`
3. Login to dashboard
4. Go to Settings → Notifications
5. Enable notifications
6. Open another browser/tab, login as different user
7. Send a message to first user
8. First user should receive notification

### Test Push Notification Manually

You can test by calling the API directly:

```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-here",
    "title": "Test Notification",
    "message": "This is a test message",
    "url": "/dashboard/messages"
  }'
```

## Troubleshooting

### Notifications Not Working

1. **Check Browser Support**
   - Ensure browser supports push notifications
   - Check browser version

2. **Check Permissions**
   - Go to browser settings
   - Check notification permissions for your site
   - Reset if denied

3. **Check HTTPS**
   - Push notifications require HTTPS in production
   - Localhost works without HTTPS

4. **Check Service Worker**
   - Open DevTools → Application → Service Workers
   - Verify service worker is registered
   - Check for errors

5. **Check VAPID Keys**
   - Verify keys in `.env.local`
   - Ensure public key matches in client code

6. **Check Console**
   - Open DevTools → Console
   - Look for errors during subscription

### Notifications Not Received

1. **Check Subscription**
   - Verify user has active subscription in database
   - Check `/api/notifications/subscribe` response

2. **Check Sending**
   - Verify `/api/notifications/send` is called
   - Check server logs for errors

3. **Check Browser Settings**
   - Ensure notifications are not blocked by browser
   - Check focus assist/do not disturb settings

## Production Deployment

### 1. Update Environment Variables

Update `.env.production` or your hosting platform:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:your-email@yourdomain.com
```

### 2. Enable HTTPS

Ensure your site is served over HTTPS.

### 3. Update Service Worker

If you change the domain, update the service worker cache name in `/public/sw.js`.

### 4. Test

Test notifications on production:
- Different browsers
- Different devices
- Mobile and desktop

## Security

### VAPID Keys

- **Never commit private keys to git**
- Store in `.env.local` (gitignored)
- Use different keys for development/production
- Rotate keys periodically

### Subscription Data

- Subscriptions stored in LMDB
- Associated with user ID
- Deleted when user logs out (optional)

### Permission Flow

- Always request permission explicitly
- Never auto-prompt on page load (bad UX)
- Show clear value proposition before asking

## Performance

### Service Worker Caching

The service worker caches essential files for offline use:
- App shell
- Icons
- Fonts

### Subscription Storage

- Multiple devices per user supported
- Automatic cleanup of invalid subscriptions
- Efficient LMDB indexing

## Future Enhancements

- [ ] Rich notifications with images
- [ ] Action buttons in notifications
- [ ] Notification grouping
- [ ] Custom notification sounds
- [ ] Notification preferences (per conversation)
- [ ] Scheduled notifications
- [ ] Notification analytics

## Resources

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [Push API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [web-push Library](https://github.com/web-push-libs/web-push)
