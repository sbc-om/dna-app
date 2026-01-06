# Troubleshooting

## Dev server fails to load assets (/_next) behind proxy/LAN hostname

Next.js dev-mode can block cross-origin asset requests.

Fix:

- Set `NEXT_ALLOWED_DEV_ORIGINS` (comma-separated) in `.env.local`.
- Restart `npm run dev`.

Implementation reference: `next.config.ts` `allowedDevOrigins`.

## LMDB errors: `MDB_READERS_FULL` or random open failures

Common causes:

- Too low `LMDB_MAX_READERS`
- Multiple environments opened during dev HMR

This repo mitigates HMR by caching the DB handle in `globalThis.__dnaLmdbDb`.

If you still hit issues:

- Increase `LMDB_MAX_READERS`
- Ensure you are not importing repositories from client components

## Uploads not visible

Uploads are written under `data/uploads/images` and referenced as `/uploads/images/<file>`.

Confirm:

- the `src/app/uploads/` route (static serving) exists and maps correctly
- Docker volume `./data:/app/data` is mounted

## Restore/backup issues

Backup/restore uses shell commands (`tar`, `rm`) via Node `exec`.

If `tar` is missing in your runtime:

- Ensure container base includes required tools
- Or replace with a Node streaming archive implementation

## Push notifications don’t arrive

- Ensure VAPID keys are set in env
- Ensure subscription records exist for the target user
- Check service worker registration

API references:

- `POST /api/notifications/subscribe`
- `POST /api/notifications/send`

