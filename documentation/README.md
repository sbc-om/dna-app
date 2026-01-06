# DNA App — Developer Documentation

This folder contains the developer-focused documentation for the **DNA** web application (Next.js App Router + TypeScript + LMDB + shadcn/ui + PWA).

> Note about language: the repository’s coding conventions require English-only identifiers and documentation content.

## Quick links

- **Single-page HTML docs (EN/AR):** [`developer-docs.html`](./developer-docs.html)
- **Architecture overview:** [`architecture.md`](./architecture.md)
- **Local development & environment:** [`development.md`](./development.md)
- **Routing + i18n (EN/AR) + RTL/LTR:** [`routing-i18n.md`](./routing-i18n.md)
- **Authentication + roles + permissions:** [`auth-permissions.md`](./auth-permissions.md)
- **Academy context (multi-tenancy):** [`academy-context.md`](./academy-context.md)
- **Data layer (LMDB) + repository patterns:** [`data-lmdb.md`](./data-lmdb.md)
- **API routes reference:** [`api.md`](./api.md)
- **Messaging + push + WhatsApp:** [`features-messaging-notifications.md`](./features-messaging-notifications.md)
- **UI conventions (game-like motion UI):** [`ui-guidelines.md`](./ui-guidelines.md)
- **Scripts, operations, maintenance:** [`scripts-maintenance.md`](./scripts-maintenance.md)
- **Deployment (Docker) + PWA:** [`deployment.md`](./deployment.md)
- **Troubleshooting:** [`troubleshooting.md`](./troubleshooting.md)

## What this app is

DNA is a bilingual (English/Arabic) web app with:

- Public pages (landing, about, contact, auth)
- Authenticated dashboard with role-based navigation
- Academy-scoped data model (selected academy stored in cookie)
- LMDB as the primary database (file-based, server-only)
- PWA offline fallback route (`/offline`) and push notifications
- File uploads persisted under `data/uploads/`

## Where to start when extending

1. Read [`architecture.md`](./architecture.md) to understand the boundaries and major subsystems.
2. Follow [`data-lmdb.md`](./data-lmdb.md) for adding new entities/repositories safely.
3. Follow [`auth-permissions.md`](./auth-permissions.md) for gated UI/routes.
4. For any new user-facing text, follow [`routing-i18n.md`](./routing-i18n.md) and add translation keys in `src/locales/*.json`.

