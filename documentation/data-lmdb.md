# Data Layer (LMDB) and Repository Conventions

## LMDB basics in this repo

LMDB is used as the primary database and is accessed **only on the server**.

- Connection module: `src/lib/db/lmdb.ts`
- Data files: `data/lmdb/data.mdb` + `data/lmdb/lock.mdb`

### Server-only protection

`src/lib/db/lmdb.ts` throws if imported in the browser:

- `if (typeof window !== 'undefined') throw ...`

Do not import repositories or LMDB connection from client components.

## Connection lifecycle

- `getDatabase()` opens LMDB once and caches it across Next.js dev HMR via `globalThis.__dnaLmdbDb`.
- `closeDatabase()` exists for scripts/tests.

LMDB options:

- `encoding: 'msgpack'`
- `compression: true`
- `mapSize`, `maxReaders`, `maxDbs` are either env-configurable or computed via a memory budget helper.

## Repository structure

Repositories live under:

- `src/lib/db/repositories/*Repository.ts`

They typically follow this pattern:

1. Define TypeScript interfaces for stored entities.
2. Define key prefixes (namespacing) like:
   - `users:`
   - `users_by_email:`
3. Implement CRUD:
   - `createX`, `findXById`, `updateX`, `deleteX`
4. Implement list queries using `db.getRange({ start, end })` with prefix bounds.
5. Maintain secondary indexes manually (e.g., email → id).

## Example: `userRepository.ts`

`src/lib/db/repositories/userRepository.ts` demonstrates:

- Entity shape (`User`)
- Create with indexes:
  - `users:<id>` → user record
  - `users_by_email:<email>` → id
  - `users_by_username:<username>` → id
- Password hashing with bcrypt (`bcryptjs`)

## Academy scoping

Many entities are academy-scoped. Use:

- `requireAcademyContext()` (`src/lib/academies/academyContext.ts`)

Then include `academyId` in entity records and/or key prefix design.

## Adding a new repository (recommended checklist)

1. Choose a stable key prefix (e.g. `training_sessions:`).
2. If you need lookup by a unique field, add a secondary index prefix.
3. Keep writes transactional “by convention”:
   - update the main record
   - update secondary indexes
4. Add list queries using `getRange()` with prefix upper bound `\xFF`.
5. Never expose raw LMDB operations from client components.

## Backups and restores

The system backs up the `data/` directory (including LMDB + uploads) via API:

- `POST /api/backup` creates `backups/backup-<timestamp>.tar.gz`
- `POST /api/restore` restores from an uploaded `.tar.gz` (overwrites `data/`)

See [`api.md`](./api.md) for endpoint notes and safety considerations.

