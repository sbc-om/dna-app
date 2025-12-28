import { getDatabase, generateId } from '../lmdb';

export type ProgramEnrollmentStatus = 'active' | 'paused' | 'completed';

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
}

const ENROLL_PREFIX = 'program_enrollment:'; // program_enrollment:{academyId}:{programId}:{userId}

function enrollmentKey(academyId: string, programId: string, userId: string) {
  return `${ENROLL_PREFIX}${academyId}:${programId}:${userId}`;
}

export async function findProgramEnrollment(params: {
  academyId: string;
  programId: string;
  userId: string;
}): Promise<ProgramEnrollment | null> {
  const db = getDatabase();
  const existing = await db.get(enrollmentKey(params.academyId, params.programId, params.userId));
  return (existing as ProgramEnrollment) || null;
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
      updatedAt: now,
    };
    await db.put(enrollmentKey(input.academyId, input.programId, input.userId), updated);
    return updated;
  }

  const enrollment: ProgramEnrollment = {
    id: generateId(),
    academyId: input.academyId,
    programId: input.programId,
    userId: input.userId,
    status: 'active',
    joinedAt: now,
    currentLevelId: input.currentLevelId,
    pointsTotal: 0,
    coachNotes: [],
    createdAt: now,
    updatedAt: now,
  };

  await db.put(enrollmentKey(input.academyId, input.programId, input.userId), enrollment);
  return enrollment;
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
  return updated;
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
