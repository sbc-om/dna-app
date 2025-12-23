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

export interface LMDBDatabase extends RootDatabase {}

/**
 * Initialize and return the LMDB database connection
 */
export function getDatabase(): LMDBDatabase {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'data', 'lmdb');
    
    // Use environment variable for map size, with fallback
    const envMapSize = process.env.LMDB_MAP_SIZE;
    const parsedEnvSize = envMapSize ? parseInt(envMapSize, 10) : NaN;
    const memoryBudget = getMemoryBudget();
    const mapSize = !Number.isNaN(parsedEnvSize)
      ? parsedEnvSize
      : memoryBudget.mapSizeBytes;
    const maxReaders = !Number.isNaN(parsedEnvSize) ? 1 : memoryBudget.maxReaders;
    const maxDbs = !Number.isNaN(parsedEnvSize) ? 4 : memoryBudget.maxDbs;
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

      console.log(
        `LMDB initialized at: ${dbPath} (mapSize: ${mapSize / 1024 / 1024}MB, profile:${profileLabel})`
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
  }
}

/**
 * Generate a unique ID for database records
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
