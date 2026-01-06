# Deployment (Docker), Networking, and PWA

## Docker

The repo includes a Dockerfile and docker-compose configuration.

- `Dockerfile` builds Next.js and runs `npm start`.
- `docker-compose.yml` runs the app on port **4040** in production.

### Volumes

Docker persists:

- `./data:/app/data` (LMDB + uploads)
- `./logs:/app/logs`

### Health checks

- Container health check calls: `GET /api/health`

## Reverse proxy variables

`docker-compose.yml` includes Nginx proxy environment variables:

- `VIRTUAL_HOST`, `VIRTUAL_PORT`, `LETSENCRYPT_HOST`, etc.

These are used by an external proxy network (`proxy`).

## PWA

PWA is configured via `@ducanh2912/next-pwa` in `next.config.ts`.

Behavior:

- PWA is disabled in development.
- PWA can be disabled in production by setting:
  - `LOW_RESOURCE_MODE=true`
- Offline fallback route:
  - `/offline` (implemented at `src/app/offline/page.tsx`)

PWA assets:

- Manifest: `public/manifest.json`
- Service worker: `public/sw.js` (generated/configured by the PWA setup)

## Push notifications

Server-side push uses `web-push`.

- Subscription endpoint: `POST /api/notifications/subscribe`
- Send endpoint: `POST /api/notifications/send`

Configure VAPID keys via env:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

