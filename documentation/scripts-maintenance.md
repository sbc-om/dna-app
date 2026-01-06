# Scripts, Operations, and Maintenance

## NPM scripts

From `package.json`:

- `npm run dev` — Next dev server on port **3016**
- `npm run dev:webpack` — dev server with Turbopack disabled
- `npm run build` — production build
- `npm run start` — production start on `${PORT:-3016}`
- `npm run lint` — ESLint

Database and maintenance scripts (run via `tsx`):

- `npm run db:init` — initializes/seeds LMDB data
- `npm run db:reset` — resets DB to admin
- `npm run create-admin` — creates an admin user
- `npm run migrate:kid-to-player` — migration script
- `npm run db:check-migration` — checks migration status

Asset generation:

- `npm run generate-icons`
- `npm run generate-favicon`
- `npm run generate-all-assets`

## Scripts location

- `scripts/*.ts` and `scripts/*.js`

## Operational endpoints

- Backups: `POST /api/backup` (admin-only)
- Restore: `POST /api/restore` (admin-only)

See [`api.md`](./api.md).

## Data storage

- Database: `data/lmdb/`
- Uploads: `data/uploads/`
- Backups: `backups/`

## Academy membership compatibility

`src/lib/academies/academyContext.ts` contains logic to ensure legacy users gain an academy membership record automatically (except global admin).

If you change role models, review:

- `ensureLegacyUserMembership()`
- manager academy locking

