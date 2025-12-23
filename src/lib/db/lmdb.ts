import type { RootDatabase } from 'lmdb';
import path from 'path';
import { getMemoryBudget, isLowResourceMode } from '@/lib/utils/systemResources';

type LmdbModule = typeof import('lmdb');

let lmdbModule: LmdbModule | null = null;

function getLmdbModule(): LmdbModule {
  if (typeof window !== 'undefined') {
    throw new Error('LMDB can only be used on the server. Do not import this module from Client Components.');
  }
  if (!lmdbModule) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    lmdbModule = require('lmdb') as LmdbModule;
  }
  return lmdbModule;
}

let db: RootDatabase | null = null;

declare global {
  var __dnaLmdbDb: RootDatabase | undefined;
}

export type LMDBDatabase = RootDatabase;

/**
 * Initialize and return the LMDB database connection
 */
export function getDatabase(): LMDBDatabase {
  if (!db) {
    // Reuse across Next.js dev HMR/module reloads to avoid opening multiple LMDB environments.
    if (globalThis.__dnaLmdbDb) {
      db = globalThis.__dnaLmdbDb;
      return db;
    }

    const dbPath = path.join(process.cwd(), 'data', 'lmdb');
    
    // Environment overrides (optional)
    const envMapSize = process.env.LMDB_MAP_SIZE;
    const envMaxReaders = process.env.LMDB_MAX_READERS;
    const envMaxDbs = process.env.LMDB_MAX_DBS;

    const parsedEnvSize = envMapSize ? parseInt(envMapSize, 10) : NaN;
    const parsedEnvMaxReaders = envMaxReaders ? parseInt(envMaxReaders, 10) : NaN;
    const parsedEnvMaxDbs = envMaxDbs ? parseInt(envMaxDbs, 10) : NaN;

    const memoryBudget = getMemoryBudget();
    const mapSize = !Number.isNaN(parsedEnvSize)
      ? parsedEnvSize
      : memoryBudget.mapSizeBytes;

    // IMPORTANT:
    // - Do NOT reduce maxReaders just because mapSize is overridden.
    // - Too-low maxReaders in a Next.js server can quickly trigger MDB_READERS_FULL.
    const maxReaders = !Number.isNaN(parsedEnvMaxReaders)
      ? parsedEnvMaxReaders
      : memoryBudget.maxReaders;

    const maxDbs = !Number.isNaN(parsedEnvMaxDbs)
      ? parsedEnvMaxDbs
      : memoryBudget.maxDbs;

    const profileLabel = isLowResourceMode() ? 'low-resource' : memoryBudget.profile;
    
    try {
      const { open } = getLmdbModule();
      db = open({
        path: dbPath,
        compression: true,
        encoding: 'msgpack',
        mapSize: mapSize,
        maxReaders,
        maxDbs,
        noMemInit: true, // Don't pre-allocate memory
      });

      globalThis.__dnaLmdbDb = db;

      console.log(
        `LMDB initialized at: ${dbPath} (mapSize: ${mapSize / 1024 / 1024}MB, maxReaders:${maxReaders}, maxDbs:${maxDbs}, profile:${profileLabel})`
      );
    } catch (error) {
      console.error('LMDB initialization failed:', error);
      throw error;
    }
  }

  return db;
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    globalThis.__dnaLmdbDb = undefined;
  }
}

/**
 * Generate a unique ID for database records
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
