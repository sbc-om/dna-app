# API Routes Reference

All API routes are implemented under `src/app/api/**/route.ts`.

## Conventions

- Use `getCurrentUser()` or `requireAuth()` to enforce authentication.
- Enforce authorization server-side (role + academy context as needed).
- Prefer using repositories instead of LMDB access directly.

## Health

- `GET /api/health`
  - File: `src/app/api/health/route.ts`
  - Returns `{ status: "ok", timestamp, service }`

## Auth

- `POST /api/auth/login`
  - File: `src/app/api/auth/login/route.ts`
  - Body: `{ email, password }`
  - Sets `auth-token` cookie

- `POST /api/auth/logout`
  - File: `src/app/api/auth/logout/route.ts`
  - Clears `auth-token` cookie

- `GET /api/auth/me`
  - File: `src/app/api/auth/me/route.ts`

## Uploads

- `POST /api/upload`
  - File: `src/app/api/upload/route.ts`
  - Multipart form-data: `file` (image only)
  - Writes to `data/uploads/images`
  - Returns public URL: `/uploads/images/<filename>`

## Backups / restore (admin)

- `POST /api/backup` (admin-only)
  - File: `src/app/api/backup/route.ts`
  - Creates `backups/backup-<timestamp>.tar.gz` containing `data/`

- `GET /api/backup` (admin-only)
  - Lists `.tar.gz` files under `backups/`

- `POST /api/restore` (admin-only)
  - File: `src/app/api/restore/route.ts`
  - Uploads a `.tar.gz` and extracts it at repo root (overwriting `data/`)
  - Requires an app restart after restore

### Safety notes

- These endpoints execute shell commands (`tar`, `rm`) using `exec`.
- In production, restrict access carefully and consider isolating them behind an admin-only network.

## Messages

- `GET /api/messages/unread-count`
  - File: `src/app/api/messages/unread-count/route.ts`
  - Returns `{ count }`

## Push Notifications

- `POST /api/notifications/subscribe`
  - File: `src/app/api/notifications/subscribe/route.ts`
  - Stores browser push subscription for the authenticated user

- `POST /api/notifications/send`
  - File: `src/app/api/notifications/send/route.ts`
  - Sends a push notification to a user’s saved subscriptions
  - Uses VAPID keys from env (with fallback defaults)

## WhatsApp

Docs exist in `docs/WHATSAPP_FEATURE.md`. Relevant API routes:

- `POST /api/whatsapp/send`
  - File: `src/app/api/whatsapp/send/route.ts`
  - Supports single and bulk sends
  - Role-gated: `admin` and `coach`

- `GET/POST /api/whatsapp/groups`
  - File: `src/app/api/whatsapp/groups/route.ts`
  - Academy-scoped via `requireAcademyContext()`

- `GET/POST /api/whatsapp/profiles`
  - File: `src/app/api/whatsapp/profiles/route.ts`
  - Academy-scoped via `requireAcademyContext()`

