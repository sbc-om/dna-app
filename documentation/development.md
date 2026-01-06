# Local Development & Environment

## Requirements

- Node.js 20+
- npm (project includes `package-lock.json`)

## Install

- Install dependencies:
  - `npm install`

## Run the app (dev)

The app runs on **port 3016** in development.

- `npm run dev`

If Turbopack causes issues, use:

- `npm run dev:webpack`

## Build & start

- `npm run build`
- `npm run start`

`start` uses `${PORT:-3016}`.

## Environment variables

This repo includes `.env`, `.env.local`, and `.env.example` in the root. Prefer updating `.env.local` for developer machines.

### Auth

- `JWT_SECRET` — used for signing session JWTs in `src/lib/auth/auth.ts`.

### Dev origin security

Next.js dev-mode can block loading `/_next` assets from non-default origins. Configure:

- `NEXT_ALLOWED_DEV_ORIGINS` — comma-separated list of additional origins/hosts.

Implementation: `next.config.ts` builds `allowedDevOrigins` from:

- `localhost`, `127.0.0.1`, `0.0.0.0`, `host.docker.internal`
- local LAN IPv4 addresses
- plus values from `NEXT_ALLOWED_DEV_ORIGINS`

### LMDB tuning

`src/lib/db/lmdb.ts` supports optional overrides:

- `LMDB_MAP_SIZE` — bytes
- `LMDB_MAX_READERS`
- `LMDB_MAX_DBS`

### PWA

- `LOW_RESOURCE_MODE=true` disables PWA in production builds (also disabled in dev).

### Push notifications (VAPID)

Push notification sending (`src/app/api/notifications/send/route.ts`) uses:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

If these are not set, the code currently falls back to built-in defaults.

### Uploads

Uploads are written to `data/uploads/images/` by `src/app/api/upload/route.ts`.

> Note: Docker `docker-compose.yml` sets `UPLOAD_DIR` and `MAX_FILE_SIZE`, but the upload route currently uses a fixed path under `data/uploads/images`. Treat `UPLOAD_DIR` as infrastructure documentation, not runtime behavior.

## Database initialization

The repo provides scripts for LMDB initialization and admin creation:

- `npm run db:init`
- `npm run create-admin`

See [`scripts-maintenance.md`](./scripts-maintenance.md) for details.

## Useful paths

- Source code: `src/`
- LMDB files: `data/lmdb/`
- Uploads: `data/uploads/`
- Logs: `logs/`
- Backups: `backups/`

