import { getDatabase, generateId } from '../lmdb';

const PROGRAM_ATTENDANCE_PREFIX = 'program_attendance:'; // program_attendance:{academyId}:{programId}:{YYYY-MM-DD}:{userId}

export interface ProgramAttendanceRecord {
  id: string;
  academyId: string;
  programId: string;
  userId: string;
  coachId: string;
  sessionDate: string; // YYYY-MM-DD
  present: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertProgramAttendanceInput {
  academyId: string;
  programId: string;
  userId: string;
  coachId: string;
  sessionDate: string;
  present: boolean;
  notes?: string;
}

function normalizeDate(date: string): string {
  if (!date) return new Date().toISOString().split('T')[0];
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().split('T')[0];
  return parsed.toISOString().split('T')[0];
}

function buildKey(academyId: string, programId: string, sessionDate: string, userId: string) {
  return `${PROGRAM_ATTENDANCE_PREFIX}${academyId}:${programId}:${sessionDate}:${userId}`;
}

export async function getProgramAttendanceForDate(params: {
  academyId: string;
  programId: string;
  sessionDate: string;
}): Promise<ProgramAttendanceRecord[]> {
  const db = getDatabase();
  const date = normalizeDate(params.sessionDate);
  const keyPrefix = `${PROGRAM_ATTENDANCE_PREFIX}${params.academyId}:${params.programId}:${date}:`;
  const records: ProgramAttendanceRecord[] = [];

  for await (const { key, value } of db.getRange({ start: keyPrefix, end: `${keyPrefix}\xFF` })) {
    const keyStr = String(key);
    if (keyStr.startsWith(keyPrefix) && value) {
      records.push(value as ProgramAttendanceRecord);
    }
  }

  records.sort((a, b) => a.userId.localeCompare(b.userId));
  return records;
}

export async function upsertProgramAttendanceRecord(input: UpsertProgramAttendanceInput): Promise<ProgramAttendanceRecord> {
  const db = getDatabase();
  const date = normalizeDate(input.sessionDate);
  const key = buildKey(input.academyId, input.programId, date, input.userId);
  const existing = (await db.get(key)) as ProgramAttendanceRecord | undefined;
  const now = new Date().toISOString();

  const record: ProgramAttendanceRecord = {
    id: existing?.id ?? generateId(),
    academyId: input.academyId,
    programId: input.programId,
    userId: input.userId,
    coachId: input.coachId,
    sessionDate: date,
    present: input.present,
    notes: input.notes,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await db.put(key, record);
  return record;
}

export async function saveProgramAttendanceBatch(params: {
  academyId: string;
  programId: string;
  coachId: string;
  sessionDate: string;
  entries: Array<{ userId: string; present: boolean; notes?: string }>;
}): Promise<ProgramAttendanceRecord[]> {
  const date = normalizeDate(params.sessionDate);
  const results: ProgramAttendanceRecord[] = [];

  for (const e of params.entries) {
    results.push(
      await upsertProgramAttendanceRecord({
        academyId: params.academyId,
        programId: params.programId,
        coachId: params.coachId,
        sessionDate: date,
        userId: e.userId,
        present: e.present,
        notes: e.notes,
      })
    );
  }

  return results;
}

export async function getProgramAttendanceByUser(params: {
  academyId: string;
  programId: string;
  userId: string;
}): Promise<ProgramAttendanceRecord[]> {
  const db = getDatabase();
  const keyPrefix = `${PROGRAM_ATTENDANCE_PREFIX}${params.academyId}:${params.programId}:`;
  const records: ProgramAttendanceRecord[] = [];

  for await (const { key, value } of db.getRange({ start: keyPrefix, end: `${keyPrefix}\xFF` })) {
    const keyStr = String(key);
    if (!keyStr.startsWith(keyPrefix) || !value) continue;

    // key = program_attendance:{academyId}:{programId}:{date}:{userId}
    const parts = keyStr.slice(PROGRAM_ATTENDANCE_PREFIX.length).split(':');
    const userIdFromKey = parts[3];
    if (userIdFromKey === params.userId) {
      records.push(value as ProgramAttendanceRecord);
    }
  }

  // Newest first
  records.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
  return records;
}

export async function getProgramAttendanceByProgram(params: {
  academyId: string;
  programId: string;
}): Promise<ProgramAttendanceRecord[]> {
  const db = getDatabase();
  const keyPrefix = `${PROGRAM_ATTENDANCE_PREFIX}${params.academyId}:${params.programId}:`;
  const records: ProgramAttendanceRecord[] = [];

  for await (const { key, value } of db.getRange({ start: keyPrefix, end: `${keyPrefix}\xFF` })) {
    const keyStr = String(key);
    if (!keyStr.startsWith(keyPrefix) || !value) continue;
    records.push(value as ProgramAttendanceRecord);
  }

  // Newest first (then stable by user)
  records.sort((a, b) => {
    const d = b.sessionDate.localeCompare(a.sessionDate);
    return d !== 0 ? d : a.userId.localeCompare(b.userId);
  });
  return records;
}

export function getProgramAttendancePrefix() {
  return PROGRAM_ATTENDANCE_PREFIX;
}
