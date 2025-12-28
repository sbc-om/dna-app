import { getDatabase, generateId } from '../lmdb';
import { DEFAULT_ACADEMY_ID } from './academyRepository';

export interface Program {
  id: string;
  academyId: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgramInput {
  academyId?: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
}

export interface UpdateProgramInput {
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  isActive?: boolean;
}

const PROGRAM_PREFIX = 'program:';

function normalizeProgramAcademy(program: Program | any, key?: string): Program {
  if (!program?.academyId) {
    const normalized: Program = { ...program, academyId: DEFAULT_ACADEMY_ID };
    if (key) {
      const db = getDatabase();
      db.put(key, normalized);
    }
    return normalized;
  }
  return program as Program;
}

export async function getAllPrograms(): Promise<Program[]> {
  const db = getDatabase();
  const programs: Program[] = [];

  const range = db.getRange({ start: PROGRAM_PREFIX, end: `${PROGRAM_PREFIX}\xFF` });
  for (const { key, value } of range) {
    const keyStr = String(key);
    if (keyStr.startsWith(PROGRAM_PREFIX) && value) {
      programs.push(normalizeProgramAcademy(value as Program, keyStr));
    }
  }

  return programs.sort((a, b) => {
    const byUpdated = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    if (byUpdated !== 0) return byUpdated;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function getProgramsByAcademyId(academyId: string): Promise<Program[]> {
  const all = await getAllPrograms();
  return all.filter((p) => p.academyId === academyId);
}

export async function findProgramById(id: string): Promise<Program | null> {
  const db = getDatabase();
  const key = `${PROGRAM_PREFIX}${id}`;
  const program = db.get(key);
  return program ? normalizeProgramAcademy(program as Program, key) : null;
}

export async function createProgram(input: CreateProgramInput): Promise<Program> {
  const db = getDatabase();
  const id = generateId();

  const now = new Date().toISOString();
  const program: Program = {
    id,
    academyId: input.academyId || DEFAULT_ACADEMY_ID,
    name: input.name,
    nameAr: input.nameAr,
    description: input.description,
    descriptionAr: input.descriptionAr,
    image: input.image,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  db.put(`${PROGRAM_PREFIX}${id}`, program);
  return program;
}

export async function updateProgram(id: string, updates: UpdateProgramInput): Promise<Program | null> {
  const db = getDatabase();
  const existing = await findProgramById(id);
  if (!existing) return null;

  const updated: Program = {
    ...existing,
    ...updates,
    academyId: existing.academyId,
    updatedAt: new Date().toISOString(),
  };

  db.put(`${PROGRAM_PREFIX}${id}`, updated);
  return updated;
}

/**
 * Deletes only the program record. Use programLevelRepository helpers to delete levels.
 */
export async function deleteProgram(id: string): Promise<boolean> {
  const db = getDatabase();
  const existing = await findProgramById(id);
  if (!existing) return false;

  db.remove(`${PROGRAM_PREFIX}${id}`);
  return true;
}
