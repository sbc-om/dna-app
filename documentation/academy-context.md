# Academy Context (Multi-tenancy)

Many dashboard modules and API routes are scoped to a selected academy.

## Cookie

- Cookie name: `academy-id`
- Constant: `ACADEMY_COOKIE_NAME` in `src/lib/academies/academyContext.ts`

## Resolver

Primary entrypoint:

- `requireAcademyContext(locale?: string)` in `src/lib/academies/academyContext.ts`

It returns:

```ts
interface AcademyContext {
  user: AuthUser;
  academyId: string;
  academyRole: AcademyMemberRole | 'global_admin';
}
```

### Role-specific behavior

- **Admin** (`user.role === 'admin'`)
  - Can switch academies via cookie
  - Does not auto-seed default academy in some flows (database-minimal)

- **Manager** (`user.role === 'manager'`)
  - Locked to a single academy
  - The resolver ignores the cookie and deterministically picks the first academy where the user is a manager

- **Coach / Parent / Player**
  - Must be a member of the selected academy
  - If no cookie exists, a default academy is selected
  - Backward compatibility: missing membership records are created automatically (see below)

## Legacy membership backfill

Function:

- `ensureLegacyUserMembership(user, academyId)`

Behavior:

- For non-admin users, if no membership record exists, one is created based on the user’s global role.

## Using academy context in API routes

Pattern:

- `const currentUser = await requireAuth();`
- `const ctx = await requireAcademyContext();`
- Filter queries by `ctx.academyId`

Example:

- `GET /api/whatsapp/groups` filters by academy.

## Adding academy scoping to a new entity

Recommended options:

1. Add `academyId` as a field in the record and filter in list/find functions.
2. Encode `academyId` in the key prefix for efficient listing, e.g.
   - `sessions:<academyId>:<id>`

Option (2) generally provides faster range scans for academy-scoped lists.

