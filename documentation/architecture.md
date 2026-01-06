# Architecture Overview

## Tech stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript
- **UI:** Tailwind + shadcn/ui (Radix UI primitives)
- **Animations:** `framer-motion` (mandatory for interactive/game-like UX)
- **Database:** LMDB (`lmdb` npm package) — server-only access
- **Auth:** JWT stored in `auth-token` cookie (custom auth helpers)
- **i18n:** Route segment `/${locale}` (`en` | `ar`) + JSON dictionaries
- **PWA:** `@ducanh2912/next-pwa` with offline fallback route `/offline`

## High-level boundaries

### 1) Routing layer (Next.js App Router)

- Global root layout: `src/app/layout.tsx`
- Root route redirect: `src/app/page.tsx` redirects to `/${locale}` based on `locale` cookie.
- Locale subtree: `src/app/[locale]/...`
- API routes: `src/app/api/**/route.ts`

### 2) UI layer (components)

Most UI components live in `src/components/` and are used by route pages/layouts.

There are two important patterns:

- **Server Components** in route pages/layouts fetch dictionaries and data.
- **Client Components** (often in `src/components`) handle interaction, animation, forms.

### 3) Domain/data layer (LMDB repositories)

- LMDB bootstrap: `src/lib/db/lmdb.ts`
- Repositories: `src/lib/db/repositories/*Repository.ts`

Repository responsibilities:

- Define the entity type(s)
- Implement CRUD and indexes
- Use a key-prefix scheme and (where needed) secondary indexes

### 4) Authentication & authorization

- Auth helpers: `src/lib/auth/auth.ts`
- Login API: `src/app/api/auth/login/route.ts`
- Logout API: `src/app/api/auth/logout/route.ts`
- Role permissions: `src/lib/db/repositories/rolePermissionRepository.ts`
- Dashboard gating: `src/app/[locale]/dashboard/layout.tsx` builds `accessibleResources` based on role permissions.

### 5) Academy context (multi-tenancy)

Many features are scoped to a selected academy.

- Academy context resolver: `src/lib/academies/academyContext.ts`
- Cookie: `academy-id`

The academy context is resolved server-side and used in API routes to filter data.

## Request/data flow (typical dashboard page)

1. User hits `/${locale}/dashboard/...`
2. Server layout `src/app/[locale]/dashboard/layout.tsx` runs:
   - `requireAuth(locale)`
   - `getRolePermissions(user.role)`
   - `getDictionary(locale)`
   - passes `dictionary`, `user`, `accessibleResources`, `locale`, and `direction` into `DashboardLayoutClient`
3. The page component fetches any additional data using repositories or server actions.
4. Client components render interactive UI.

## Where data lives

- LMDB files: `data/lmdb/data.mdb` + `data/lmdb/lock.mdb`
- Uploads (served from `/uploads/...` routes): `data/uploads/*`
- Backups: `backups/*.tar.gz`
- Logs: `logs/`

## Extension checklist (new feature/module)

When you add a new module/page/entity:

1. **Add routes** under `src/app/[locale]/dashboard/<module>/...`
2. **Add repository** under `src/lib/db/repositories/<entity>Repository.ts` (server-only)
3. **Add permissions**:
   - Add a new boolean flag in `RolePermission['permissions']` (if needed)
   - Map it to a `dashboard.<module>` resource string in `src/app/[locale]/dashboard/layout.tsx`
   - Gate UI elements and API routes appropriately
4. **Add translations** in `src/locales/en.json` and `src/locales/ar.json`
5. **Follow motion UI guidelines** (`framer-motion`) for interactive screens

