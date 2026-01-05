import { getDatabase, generateId } from '../lmdb';

export type ProgramEnrollmentStatus = 'active' | 'paused' | 'completed';

export type ProgramLevelHistoryEntry = {
  levelId: string;
  startedAt: string;
  endedAt?: string;
  setBy?: string;
  comment?: string;
  pointsDelta?: number;
};

export type ProgramCoachNote = {
  id: string;
  coachUserId: string;
  createdAt: string;
  pointsDelta?: number;
  comment?: string;
};

export interface ProgramEnrollment {
  id: string;
  academyId: string;
  programId: string;
  userId: string; // player userId

  status: ProgramEnrollmentStatus;
  joinedAt: string;

  currentLevelId?: string;

  /**
   * Program-level journey history. This is separate from the DNA stage system.
   * Each entry represents a period where the player was assigned to a given level.
   */
  levelHistory: ProgramLevelHistoryEntry[];

  pointsTotal: number;
  coachNotes: ProgramCoachNote[];

  createdAt: string;
  updatedAt: string;
}

export interface CreateProgramEnrollmentInput {
  academyId: string;
  programId: string;
  userId: string;
  currentLevelId?: string;
}

export interface UpdateProgramEnrollmentInput {
  status?: ProgramEnrollmentStatus;
  currentLevelId?: string;
  levelHistory?: ProgramLevelHistoryEntry[];
}

const ENROLL_PREFIX = 'program_enrollment:'; // program_enrollment:{academyId}:{programId}:{userId}

function enrollmentKey(academyId: string, programId: string, userId: string) {
  return `${ENROLL_PREFIX}${academyId}:${programId}:${userId}`;
}

function normalizeEnrollment(
  enrollment: ProgramEnrollment | any,
  key?: string
): ProgramEnrollment {
  const now = new Date().toISOString();

  const levelHistoryRaw = Array.isArray(enrollment?.levelHistory) ? enrollment.levelHistory : [];
  const hasAnyHistory = levelHistoryRaw.length > 0;
  const currentLevelId = enrollment?.currentLevelId;

  // Backfill history for older records.
  const levelHistory: ProgramLevelHistoryEntry[] = hasAnyHistory
    ? levelHistoryRaw
    : currentLevelId
      ? [
          {
            levelId: currentLevelId,
            startedAt: enrollment?.joinedAt || enrollment?.createdAt || now,
          },
        ]
      : [];

  const normalized: ProgramEnrollment = {
    ...enrollment,
    status: (enrollment?.status as ProgramEnrollmentStatus) || 'active',
    joinedAt: enrollment?.joinedAt || enrollment?.createdAt || now,
    levelHistory,
  };

  const changed =
    normalized.status !== enrollment?.status ||
    normalized.joinedAt !== enrollment?.joinedAt ||
    normalized.levelHistory !== enrollment?.levelHistory;

  if (changed && key) {
    const db = getDatabase();
    db.put(key, normalized);
  }

  return normalized;
}

export async function findProgramEnrollment(params: {
  academyId: string;
  programId: string;
  userId: string;
}): Promise<ProgramEnrollment | null> {
  const db = getDatabase();
  const key = enrollmentKey(params.academyId, params.programId, params.userId);
  const existing = await db.get(key);
  return existing ? normalizeEnrollment(existing as ProgramEnrollment, key) : null;
}

export async function upsertProgramEnrollment(input: CreateProgramEnrollmentInput): Promise<ProgramEnrollment> {
  const db = getDatabase();
  const now = new Date().toISOString();

  const existing = await findProgramEnrollment({
    academyId: input.academyId,
    programId: input.programId,
    userId: input.userId,
  });

  if (existing) {
    const updated: ProgramEnrollment = {
      ...existing,
      currentLevelId: input.currentLevelId ?? existing.currentLevelId,
      status: existing.status || 'active',
      levelHistory: Array.isArray(existing.levelHistory)
        ? existing.levelHistory
        : existing.currentLevelId
          ? [
              {
                levelId: existing.currentLevelId,
                startedAt: existing.joinedAt || existing.createdAt || now,
              },
            ]
          : [],
      updatedAt: now,
    };
    await db.put(enrollmentKey(input.academyId, input.programId, input.userId), updated);
    return normalizeEnrollment(updated);
  }

  const enrollment: ProgramEnrollment = {
    id: generateId(),
    academyId: input.academyId,
    programId: input.programId,
    userId: input.userId,
    status: 'active',
    joinedAt: now,
    currentLevelId: input.currentLevelId,
    levelHistory: input.currentLevelId
      ? [
          {
            levelId: input.currentLevelId,
            startedAt: now,
          },
        ]
      : [],
    pointsTotal: 0,
    coachNotes: [],
    createdAt: now,
    updatedAt: now,
  };

  await db.put(enrollmentKey(input.academyId, input.programId, input.userId), enrollment);
  return normalizeEnrollment(enrollment);
}

export async function updateProgramEnrollment(params: {
  academyId: string;
  programId: string;
  userId: string;
  updates: UpdateProgramEnrollmentInput;
}): Promise<ProgramEnrollment | null> {
  const db = getDatabase();
  const existing = await findProgramEnrollment(params);
  if (!existing) return null;

  const updated: ProgramEnrollment = {
    ...existing,
    ...params.updates,
    academyId: existing.academyId,
    programId: existing.programId,
    userId: existing.userId,
    updatedAt: new Date().toISOString(),
  };

  await db.put(enrollmentKey(params.academyId, params.programId, params.userId), updated);
  return normalizeEnrollment(updated);
}

export async function removeProgramEnrollment(params: {
  academyId: string;
  programId: string;
  userId: string;
}): Promise<boolean> {
  const db = getDatabase();
  const existing = await findProgramEnrollment(params);
  if (!existing) return false;
  await db.remove(enrollmentKey(params.academyId, params.programId, params.userId));
  return true;
}

export async function listProgramEnrollmentsByProgram(params: {
  academyId: string;
  programId: string;
}): Promise<ProgramEnrollment[]> {
  const db = getDatabase();
  const items: ProgramEnrollment[] = [];

  const start = `${ENROLL_PREFIX}${params.academyId}:${params.programId}:`;
  const range = db.getRange({ start, end: `${start}\xFF` });

  for (const { key, value } of range) {
    const keyStr = String(key);
    if (keyStr.startsWith(start) && value) {
      items.push(value as ProgramEnrollment);
    }
  }

  return items.sort((a, b) => a.userId.localeCompare(b.userId));
}

/**
 * Delete all program enrollments for a given program.
 *
 * Used when deleting a program to ensure no orphan enrollment entries appear in player views.
 */
export async function deleteProgramEnrollmentsByProgram(params: {
  academyId: string;
  programId: string;
}): Promise<number> {
  const db = getDatabase();
  const start = `${ENROLL_PREFIX}${params.academyId}:${params.programId}:`;
  let deleted = 0;

  for await (const { key } of db.getRange({ start, end: `${start}\xFF` })) {
    const keyStr = String(key);
    if (!keyStr.startsWith(start)) continue;
    await db.remove(keyStr);
    deleted += 1;
  }

  return deleted;
}

export async function listProgramEnrollmentsByUser(params: {
  academyId: string;
  userId: string;
}): Promise<ProgramEnrollment[]> {
  const db = getDatabase();
  const items: ProgramEnrollment[] = [];

  const start = `${ENROLL_PREFIX}${params.academyId}:`;
  const range = db.getRange({ start, end: `${start}\xFF` });

  for (const { key, value } of range) {
    const keyStr = String(key);
    if (!keyStr.startsWith(start) || !value) continue;

    // key = program_enrollment:{academyId}:{programId}:{userId}
    const parts = keyStr.slice(ENROLL_PREFIX.length).split(':');
    const userIdFromKey = parts[2];
    if (userIdFromKey === params.userId) {
      items.push(value as ProgramEnrollment);
    }
  }

  // Recent first by joinedAt
  return items.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
}

export async function appendProgramCoachNote(params: {
  academyId: string;
  programId: string;
  userId: string;
  note: Omit<ProgramCoachNote, 'id' | 'createdAt'> & { id?: string; createdAt?: string };
  maxNotes?: number;
}): Promise<ProgramEnrollment | null> {
  const db = getDatabase();
  const existing = await findProgramEnrollment(params);
  if (!existing) return null;

  const now = params.note.createdAt ?? new Date().toISOString();
  const id = params.note.id ?? generateId();
  const nextNote: ProgramCoachNote = {
    ...params.note,
    id,
    createdAt: now,
  };

  const max = params.maxNotes ?? 200;
  const nextNotes = [nextNote, ...existing.coachNotes].slice(0, max);

  const nextPoints =
    existing.pointsTotal + (typeof nextNote.pointsDelta === 'number' && Number.isFinite(nextNote.pointsDelta) ? nextNote.pointsDelta : 0);

  const updated: ProgramEnrollment = {
    ...existing,
    coachNotes: nextNotes,
    pointsTotal: nextPoints,
    updatedAt: new Date().toISOString(),
  };

  await db.put(enrollmentKey(params.academyId, params.programId, params.userId), updated);
  return updated;
}
