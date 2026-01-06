# Authentication, Roles, and Permissions

## Authentication model

Auth is implemented with a **JWT stored in an HTTP-only cookie**.

- Cookie name: `auth-token`
- Issuer/verifier: `src/lib/auth/auth.ts`

Key functions:

- `createSession(user)` → returns JWT string
- `verifySession(token)` → returns payload or `null`
- `getCurrentUser()` → returns `AuthUser | null`
- `requireAuth(locale?)` → returns `AuthUser` or redirects to `/${locale}/auth/login`
- `requireAdmin(locale?)` → redirects to `/${locale}/dashboard/forbidden` if not admin

### Login / logout endpoints

- `POST /api/auth/login` (`src/app/api/auth/login/route.ts`)
  - verifies email + bcrypt password
  - sets `auth-token` cookie

- `POST /api/auth/logout` (`src/app/api/auth/logout/route.ts`)
  - clears `auth-token` cookie

- `GET /api/auth/me` (`src/app/api/auth/me/route.ts`)
  - returns current user summary

## Roles

Roles are defined in:

- `src/config/roles` (see usage from repositories)

User records store role as `UserRole`.

## Permissions model (current implementation)

This app currently uses **role-permission booleans** stored in LMDB.

- Repository: `src/lib/db/repositories/rolePermissionRepository.ts`

Shape:

- `RolePermission.permissions` includes flags such as:
  - `canManageUsers`
  - `canManageRoles`
  - `canManagePrograms`
  - `canCoachPrograms`
  - `canSendWhatsApp`
  - etc.

Defaults are embedded in code and merged/backfilled for older records.

### Dashboard navigation gating

The dashboard layout builds a list of resource keys based on the permission flags:

- `src/app/[locale]/dashboard/layout.tsx`

Example output values:

- `dashboard.users`
- `dashboard.whatsapp`
- `dashboard.programs`

Those are passed into `DashboardLayoutClient` as `accessibleResources`, which determines which sidebar items are shown.

### API gating

API routes typically gate access using:

- `getCurrentUser()` or `requireAuth()`
- plus role checks and/or academy context checks

Example:

- `POST /api/whatsapp/send` allows only `admin` and `coach`.

## Adding a new permission

1. Add a boolean to `RolePermission['permissions']` in `rolePermissionRepository.ts`.
2. Add defaults for each role in `DEFAULT_PERMISSIONS`.
3. Map the flag to a resource key in `src/app/[locale]/dashboard/layout.tsx`.
4. Update the sidebar/menu UI (typically driven by `accessibleResources`).
5. Enforce the permission server-side in API routes and/or server components.

> Important: UI gating is for UX. Security must be enforced server-side.

