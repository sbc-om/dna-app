import { getDatabase, generateId } from '../lmdb';

export const DEFAULT_ACADEMY_ID = 'default';

export interface Academy {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CreateAcademyInput {
  name: string;
  nameAr: string;
  slug?: string;
}

export interface UpdateAcademyInput {
  name?: string;
  nameAr?: string;
  slug?: string;
  isActive?: boolean;
}

const ACADEMY_PREFIX = 'academy:';
const ACADEMY_BY_SLUG_PREFIX = 'academy_by_slug:';

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64);
}

export async function createAcademy(input: CreateAcademyInput, createdBy: string): Promise<Academy> {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  const slug = normalizeSlug(input.slug || input.name);
  if (!slug) {
    throw new Error('Invalid academy slug');
  }

  const existingSlug = await db.get(`${ACADEMY_BY_SLUG_PREFIX}${slug}`);
  if (existingSlug) {
    throw new Error('Academy slug already exists');
  }

  const academy: Academy = {
    id,
    name: input.name,
    nameAr: input.nameAr,
    slug,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    createdBy,
  };

  await db.put(`${ACADEMY_PREFIX}${id}`, academy);
  await db.put(`${ACADEMY_BY_SLUG_PREFIX}${slug}`, id);

  return academy;
}

export async function updateAcademy(id: string, input: UpdateAcademyInput): Promise<Academy | null> {
  const db = getDatabase();
  const existing = await findAcademyById(id);
  if (!existing) return null;

  if (input.slug && normalizeSlug(input.slug) !== existing.slug) {
    const nextSlug = normalizeSlug(input.slug);
    const existingId = await db.get(`${ACADEMY_BY_SLUG_PREFIX}${nextSlug}`);
    if (existingId && existingId !== id) {
      throw new Error('Academy slug already exists');
    }
    await db.remove(`${ACADEMY_BY_SLUG_PREFIX}${existing.slug}`);
    await db.put(`${ACADEMY_BY_SLUG_PREFIX}${nextSlug}`, id);
    existing.slug = nextSlug;
  }

  const updated: Academy = {
    ...existing,
    name: input.name ?? existing.name,
    nameAr: input.nameAr ?? existing.nameAr,
    slug: input.slug ? normalizeSlug(input.slug) : existing.slug,
    isActive: input.isActive ?? existing.isActive,
    updatedAt: new Date().toISOString(),
  };

  await db.put(`${ACADEMY_PREFIX}${id}`, updated);
  return updated;
}

export async function findAcademyById(id: string): Promise<Academy | null> {
  const db = getDatabase();
  const academy = await db.get(`${ACADEMY_PREFIX}${id}`);
  return academy || null;
}

export async function findAcademyBySlug(slug: string): Promise<Academy | null> {
  const db = getDatabase();
  const id = await db.get(`${ACADEMY_BY_SLUG_PREFIX}${normalizeSlug(slug)}`);
  if (!id) return null;
  return findAcademyById(id);
}

export async function getAllAcademies(): Promise<Academy[]> {
  const db = getDatabase();
  const academies: Academy[] = [];

  const range = db.getRange({ start: ACADEMY_PREFIX, end: `${ACADEMY_PREFIX}\xFF` });
  for (const { key, value } of range) {
    const keyStr = String(key);
    if (keyStr.startsWith(ACADEMY_PREFIX) && value) {
      academies.push(value as Academy);
    }
  }

  return academies.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getActiveAcademies(): Promise<Academy[]> {
  const all = await getAllAcademies();
  return all.filter((a) => a.isActive);
}

/**
 * Ensure a default academy exists for legacy single-tenant data.
 */
export async function ensureDefaultAcademyExists(createdBy: string = 'system'): Promise<Academy> {
  const existing = await findAcademyById(DEFAULT_ACADEMY_ID);
  if (existing) return existing;

  const db = getDatabase();
  const now = new Date().toISOString();

  const academy: Academy = {
    id: DEFAULT_ACADEMY_ID,
    name: 'Default Academy',
    nameAr: 'Default Academy',
    slug: 'default',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    createdBy,
  };

  const existingSlug = await db.get(`${ACADEMY_BY_SLUG_PREFIX}${academy.slug}`);
  if (!existingSlug) {
    await db.put(`${ACADEMY_BY_SLUG_PREFIX}${academy.slug}`, academy.id);
  }

  await db.put(`${ACADEMY_PREFIX}${academy.id}`, academy);
  return academy;
}
