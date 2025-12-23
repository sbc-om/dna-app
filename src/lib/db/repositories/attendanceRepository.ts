import { getDatabase, generateId } from '../lmdb';

const ATTENDANCE_PREFIX = 'attendance:';

export interface AttendanceRecord {
  id: string;
  courseId: string;
  studentId: string;
  coachId: string;
  sessionDate: string; // YYYY-MM-DD
  present: boolean;
  score?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertAttendanceInput {
  courseId: string;
  studentId: string;
  coachId: string;
  sessionDate: string;
  present: boolean;
  score?: number;
  notes?: string;
}

function normalizeDate(date: string): string {
  if (!date) {
    return new Date().toISOString().split('T')[0];
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return parsed.toISOString().split('T')[0];
}

function buildKey(courseId: string, sessionDate: string, studentId: string) {
  return `${ATTENDANCE_PREFIX}${courseId}:${sessionDate}:${studentId}`;
}

export async function getAttendanceForCourseAndDate(
  courseId: string,
  sessionDate: string
): Promise<AttendanceRecord[]> {
  const db = getDatabase();
  const date = normalizeDate(sessionDate);
  const keyPrefix = `${ATTENDANCE_PREFIX}${courseId}:${date}`;
  const records: AttendanceRecord[] = [];

  for await (const { key, value } of db.getRange({ start: keyPrefix, end: `${keyPrefix}\xFF` })) {
    const keyStr = String(key);
    if (keyStr.startsWith(keyPrefix)) {
      records.push(value as AttendanceRecord);
    }
  }

  return records;
}

export async function upsertAttendanceRecord(input: UpsertAttendanceInput): Promise<AttendanceRecord> {
  const db = getDatabase();
  const date = normalizeDate(input.sessionDate);
  const key = buildKey(input.courseId, date, input.studentId);
  const existing = (await db.get(key)) as AttendanceRecord | undefined;
  const now = new Date().toISOString();

  const record: AttendanceRecord = {
    id: existing?.id ?? generateId(),
    courseId: input.courseId,
    studentId: input.studentId,
    coachId: input.coachId,
    sessionDate: date,
    present: input.present,
    score: input.score,
    notes: input.notes,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await db.put(key, record);
  return record;
}

export async function saveAttendanceBatch(
  courseId: string,
  coachId: string,
  sessionDate: string,
  entries: Array<{ studentId: string; present: boolean; score?: number; notes?: string }>
): Promise<AttendanceRecord[]> {
  const results: AttendanceRecord[] = [];
  for (const entry of entries) {
    const record = await upsertAttendanceRecord({
      courseId,
      coachId,
      sessionDate,
      studentId: entry.studentId,
      present: entry.present,
      score: entry.score,
      notes: entry.notes,
    });
    results.push(record);
  }
  return results;
}

export async function getAttendanceByStudentAndCourse(
  studentId: string,
  courseId: string
): Promise<AttendanceRecord[]> {
  const db = getDatabase();
  const keyPrefix = `${ATTENDANCE_PREFIX}${courseId}:`;
  const records: AttendanceRecord[] = [];

  for await (const { key, value } of db.getRange({ start: keyPrefix, end: `${keyPrefix}\xFF` })) {
    const keyStr = String(key);
    if (keyStr.startsWith(keyPrefix)) {
      const record = value as AttendanceRecord;
      if (record.studentId === studentId) {
        records.push(record);
      }
    }
  }

  // Sort by date descending (newest first)
  records.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
  return records;
}

export async function getAttendanceByCourse(courseId: string): Promise<AttendanceRecord[]> {
  const db = getDatabase();
  const keyPrefix = `${ATTENDANCE_PREFIX}${courseId}:`;
  const records: AttendanceRecord[] = [];

  for await (const { key, value } of db.getRange({ start: keyPrefix, end: `${keyPrefix}\xFF` })) {
    const keyStr = String(key);
    if (keyStr.startsWith(keyPrefix)) {
      records.push(value as AttendanceRecord);
    }
  }

  records.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
  return records;
}
