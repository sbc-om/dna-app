# Messaging, Notifications, and WhatsApp

This app includes three distinct communication channels:

1. **In-app messages** (LMDB-backed)
2. **Push notifications** (PWA web push)
3. **WhatsApp integration** (external provider)

## In-app messages

- Unread count endpoint:
  - `GET /api/messages/unread-count`
  - file: `src/app/api/messages/unread-count/route.ts`

Message storage is handled by:

- `src/lib/db/repositories/messageRepository.ts`

(Use repositories when extending message features.)

## Push notifications (Web Push)

### Subscribe

- `POST /api/notifications/subscribe`
  - stores a push subscription for the authenticated user
  - repository: `src/lib/db/repositories/pushSubscriptionRepository.ts`

### Send

- `POST /api/notifications/send`
  - sends to all subscriptions for a user
  - uses `web-push`

Environment variables:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

Note: the route currently includes fallback keys if env vars are missing. For production security, always set real keys.

## WhatsApp

WhatsApp features are documented in detail in:

- `docs/WHATSAPP_FEATURE.md`

### Key API routes

- `POST /api/whatsapp/send`
  - single and bulk sending
  - role gated: admin + coach

- `GET/POST /api/whatsapp/groups`
  - academy-scoped via `requireAcademyContext()`

- `GET/POST /api/whatsapp/profiles`
  - academy-scoped via `requireAcademyContext()`

### Data storage

WhatsApp metadata is stored in LMDB:

- `src/lib/db/repositories/whatsappGroupRepository.ts`
- `src/lib/db/repositories/whatsappProfileRepository.ts`

### Extension guidelines

- Enforce role checks in API routes.
- Enforce academy context for any group/profile list.
- Validate phone numbers before sending (`validatePhoneNumber`).

