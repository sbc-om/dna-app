import { getDatabase, generateId } from '../lmdb';
import { DEFAULT_ACADEMY_ID } from './academyRepository';
import { getDefaultProgramLevelColor, normalizeHexColor } from '@/lib/theme/accentColors';

export type ProgramLevelPassRules = {
  /** Minimum number of attended program sessions required while in this level. */
  minSessionsAttended?: number;
  /** Minimum points required while in this level (derived from coach notes / points events). */
  minPointsEarned?: number;
};

export interface ProgramLevel {
  id: string;
  academyId: string;
  programId: string;
  order: number;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  /** Hex color used as the UI accent for this level (e.g. "#FF5F02"). */
  color: string;
  passRules: ProgramLevelPassRules;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgramLevelInput {
  academyId?: string;
  programId: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  color?: string;
  passRules?: ProgramLevelPassRules;
}

export interface UpdateProgramLevelInput {
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  color?: string;
  passRules?: ProgramLevelPassRules;
}

const LEVEL_PREFIX = 'program_level:';

function normalizeLevel(level: ProgramLevel | any, key?: string): ProgramLevel {
  const academyId = level?.academyId || DEFAULT_ACADEMY_ID;
  const order = typeof level?.order === 'number' ? level.order : 1;
  const color = normalizeHexColor(level?.color) ?? getDefaultProgramLevelColor(order);

  // Normalize/strip deprecated rule fields from existing stored data.
  const passRules = safeRules(level?.passRules);

  const normalized: ProgramLevel = {
    ...level,
    academyId,
    order,
    color,
    passRules,
  };

  const changed =
    normalized.academyId !== level?.academyId ||
    normalized.color !== level?.color ||
    normalized.order !== level?.order ||
    JSON.stringify(normalized.passRules) !== JSON.stringify(level?.passRules);

  if (changed && key) {
    const db = getDatabase();
    db.put(key, normalized);
  }

  return normalized;
}

function safeColor(input: unknown, order: number): string {
  return normalizeHexColor(input) ?? getDefaultProgramLevelColor(order);
}

function safeRules(input?: unknown): ProgramLevelPassRules {
  const r = (input && typeof input === 'object' ? (input as any) : {}) as any;
  const legacyMin = typeof r.minXpEarned === 'number' ? r.minXpEarned : undefined;
  const next: ProgramLevelPassRules = {
    minSessionsAttended: typeof r.minSessionsAttended === 'number' ? r.minSessionsAttended : undefined,
    minPointsEarned: typeof r.minPointsEarned === 'number' ? r.minPointsEarned : legacyMin,
  };

  // Drop invalid / negative values
  for (const k of Object.keys(next) as Array<keyof ProgramLevelPassRules>) {
    const v = next[k];
    if (typeof v === 'number' && (!Number.isFinite(v) || v < 0)) {
      delete next[k];
    }
  }

  return next;
}

export async function getAllProgramLevels(): Promise<ProgramLevel[]> {
  const db = getDatabase();
  const levels: ProgramLevel[] = [];

  const range = db.getRange({ start: LEVEL_PREFIX, end: `${LEVEL_PREFIX}\xFF` });
  for (const { key, value } of range) {
    const keyStr = String(key);
    if (keyStr.startsWith(LEVEL_PREFIX) && value) {
      levels.push(normalizeLevel(value as ProgramLevel, keyStr));
    }
  }

  return levels;
}

export async function getProgramLevelsByProgramId(programId: string): Promise<ProgramLevel[]> {
  const all = await getAllProgramLevels();
  return all
    .filter((l) => l.programId === programId)
    .sort((a, b) => a.order - b.order);
}

export async function getProgramLevelsByProgramIdAndAcademyId(programId: string, academyId: string): Promise<ProgramLevel[]> {
  const levels = await getProgramLevelsByProgramId(programId);
  return levels.filter((l) => l.academyId === academyId);
}

export async function findProgramLevelById(id: string): Promise<ProgramLevel | null> {
  const db = getDatabase();
  const key = `${LEVEL_PREFIX}${id}`;
  const level = db.get(key);
  return level ? normalizeLevel(level as ProgramLevel, key) : null;
}

async function nextOrderForProgram(programId: string): Promise<number> {
  const existing = await getProgramLevelsByProgramId(programId);
  if (existing.length === 0) return 1;
  return Math.max(...existing.map((l) => l.order)) + 1;
}

export async function createProgramLevel(input: CreateProgramLevelInput): Promise<ProgramLevel> {
  const db = getDatabase();
  const id = generateId();

  const now = new Date().toISOString();
  const order = await nextOrderForProgram(input.programId);

  const level: ProgramLevel = {
    id,
    academyId: input.academyId || DEFAULT_ACADEMY_ID,
    programId: input.programId,
    order,
    name: input.name,
    nameAr: input.nameAr,
    description: input.description,
    descriptionAr: input.descriptionAr,
    image: input.image,
    color: safeColor(input.color, order),
    passRules: safeRules(input.passRules),
    createdAt: now,
    updatedAt: now,
  };

  db.put(`${LEVEL_PREFIX}${id}`, level);
  return level;
}

export async function updateProgramLevel(id: string, updates: UpdateProgramLevelInput): Promise<ProgramLevel | null> {
  const db = getDatabase();
  const existing = await findProgramLevelById(id);
  if (!existing) return null;

  const updated: ProgramLevel = {
    ...existing,
    ...updates,
    academyId: existing.academyId,
    programId: existing.programId,
    order: existing.order,
    color: updates.color !== undefined ? safeColor(updates.color, existing.order) : existing.color,
    passRules: updates.passRules ? safeRules(updates.passRules) : existing.passRules,
    updatedAt: new Date().toISOString(),
  };

  db.put(`${LEVEL_PREFIX}${id}`, updated);
  return updated;
}

export async function deleteProgramLevel(id: string): Promise<boolean> {
  const db = getDatabase();
  const existing = await findProgramLevelById(id);
  if (!existing) return false;

  db.remove(`${LEVEL_PREFIX}${id}`);

  // Re-pack ordering for remaining levels within the same program
  const remaining = await getProgramLevelsByProgramId(existing.programId);
  const normalized = remaining
    .filter((l) => l.id !== id)
    .sort((a, b) => a.order - b.order)
    .map((l, idx) => ({ ...l, order: idx + 1 }));

  for (const lvl of normalized) {
    db.put(`${LEVEL_PREFIX}${lvl.id}`, { ...lvl, updatedAt: new Date().toISOString() });
  }

  return true;
}

export async function deleteProgramLevelsByProgramId(programId: string): Promise<number> {
  const db = getDatabase();
  const levels = await getProgramLevelsByProgramId(programId);
  for (const lvl of levels) {
    db.remove(`${LEVEL_PREFIX}${lvl.id}`);
  }
  return levels.length;
}

export async function moveProgramLevel(levelId: string, direction: 'up' | 'down'): Promise<ProgramLevel[] | null> {
  const db = getDatabase();
  const level = await findProgramLevelById(levelId);
  if (!level) return null;

  const levels = await getProgramLevelsByProgramId(level.programId);
  const idx = levels.findIndex((l) => l.id === levelId);
  if (idx === -1) return null;

  const swapWith = direction === 'up' ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= levels.length) return levels;

  const a = levels[idx];
  const b = levels[swapWith];

  const now = new Date().toISOString();
  const updatedA: ProgramLevel = { ...a, order: b.order, updatedAt: now };
  const updatedB: ProgramLevel = { ...b, order: a.order, updatedAt: now };

  db.put(`${LEVEL_PREFIX}${updatedA.id}`, updatedA);
  db.put(`${LEVEL_PREFIX}${updatedB.id}`, updatedB);

  return (await getProgramLevelsByProgramId(level.programId)).sort((x, y) => x.order - y.order);
}
