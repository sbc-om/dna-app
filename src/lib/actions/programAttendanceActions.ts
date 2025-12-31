'use server';

import { unstable_noStore as noStore, revalidatePath } from 'next/cache';
import { requireAcademyContext } from '@/lib/academies/academyContext';
import { requireAuth } from '@/lib/auth/auth';
import { getAcademyMembership } from '@/lib/db/repositories/academyMembershipRepository';
import { findProgramById } from '@/lib/db/repositories/programRepository';
import { listProgramEnrollmentsByProgram } from '@/lib/db/repositories/programEnrollmentRepository';
import {
  getProgramAttendanceForDate,
  getProgramAttendanceByProgram,
  getProgramAttendanceByUser,
  saveProgramAttendanceBatch,
  type ProgramAttendanceRecord,
} from '@/lib/db/repositories/programAttendanceRepository';
import { findUserById } from '@/lib/db/repositories/userRepository';

function normalizeDate(date: string | undefined) {
  if (!date) return new Date().toISOString().split('T')[0];
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().split('T')[0];
  return parsed.toISOString().split('T')[0];
}

async function assertCanCoachPrograms(params: { locale: string; academyId: string }) {
  const me = await requireAuth(params.locale);
  if (me.role === 'admin') return { me };

  const membership = await getAcademyMembership(params.academyId, me.id);
  const canCoach = membership?.role === 'coach' || membership?.role === 'manager';
  if (!canCoach) {
    throw new Error('Unauthorized');
  }
  return { me };
}

export async function getProgramAttendanceAction(params: {
  locale: string;
  academyId?: string;
  programId: string;
  sessionDate?: string;
}): Promise<{ success: true; records: ProgramAttendanceRecord[]; sessionDate: string } | { success: false; error: string }> {
  noStore();
  try {
    const academyId = params.academyId ?? (await requireAcademyContext(params.locale)).academyId;
    await assertCanCoachPrograms({ locale: params.locale, academyId });

    const program = await findProgramById(params.programId);
    if (!program) return { success: false, error: 'Program not found' };
    if (program.academyId !== academyId) return { success: false, error: 'Unauthorized' };

    const sessionDate = normalizeDate(params.sessionDate);

    // Only return attendance for enrolled players.
    const enrollments = await listProgramEnrollmentsByProgram({ academyId, programId: params.programId });
    const allowedUserIds = new Set(enrollments.map((e) => e.userId));

    const all = await getProgramAttendanceForDate({ academyId, programId: params.programId, sessionDate });
    const records = all.filter((r) => allowedUserIds.has(r.userId));

    return { success: true, records, sessionDate };
  } catch (error) {
    console.error('Error getting program attendance:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get attendance' };
  }
}

export async function saveProgramAttendanceAction(params: {
  locale: string;
  academyId?: string;
  programId: string;
  sessionDate: string;
  entries: Array<{ userId: string; present: boolean; notes?: string }>;
}): Promise<{ success: true; records: ProgramAttendanceRecord[] } | { success: false; error: string }> {
  try {
    const academyId = params.academyId ?? (await requireAcademyContext(params.locale)).academyId;
    const { me } = await assertCanCoachPrograms({ locale: params.locale, academyId });

    const program = await findProgramById(params.programId);
    if (!program) return { success: false, error: 'Program not found' };
    if (program.academyId !== academyId) return { success: false, error: 'Unauthorized' };

    const sessionDate = normalizeDate(params.sessionDate);

    // Only allow saving attendance for enrolled players.
    const enrollments = await listProgramEnrollmentsByProgram({ academyId, programId: params.programId });
    const allowedUserIds = new Set(enrollments.map((e) => e.userId));

    const safeEntries = params.entries.filter((e) => allowedUserIds.has(e.userId));
    const records = await saveProgramAttendanceBatch({
      academyId,
      programId: params.programId,
      coachId: me.id,
      sessionDate,
      entries: safeEntries,
    });

    revalidatePath(`/${params.locale}/dashboard/programs`, 'page');

    return { success: true, records };
  } catch (error) {
    console.error('Error saving program attendance:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to save attendance' };
  }
}

export async function getProgramAttendanceSummaryForProgramAction(params: {
  locale: string;
  academyId?: string;
  programId: string;
}): Promise<
  | { success: true; byUserId: Record<string, { attended: number; marked: number }> }
  | { success: false; error: string }
> {
  noStore();
  try {
    const academyId = params.academyId ?? (await requireAcademyContext(params.locale)).academyId;
    await assertCanCoachPrograms({ locale: params.locale, academyId });

    const program = await findProgramById(params.programId);
    if (!program) return { success: false, error: 'Program not found' };
    if (program.academyId !== academyId) return { success: false, error: 'Unauthorized' };

    const records = await getProgramAttendanceByProgram({ academyId, programId: params.programId });
    const byUserId: Record<string, { attended: number; marked: number }> = {};
    for (const r of records) {
      const cur = byUserId[r.userId] ?? { attended: 0, marked: 0 };
      cur.marked += 1;
      if (r.present) cur.attended += 1;
      byUserId[r.userId] = cur;
    }

    return { success: true, byUserId };
  } catch (error) {
    console.error('Error getting program attendance summary:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get summary' };
  }
}

export async function getProgramAttendanceSummaryForUserProgramsAction(params: {
  locale: string;
  academyId?: string;
  userId: string;
  programIds: string[];
}): Promise<
  | { success: true; byProgramId: Record<string, { attended: number; marked: number }> }
  | { success: false; error: string }
> {
  noStore();
  try {
    const me = await requireAuth(params.locale);
    const academyId = params.academyId ?? (await requireAcademyContext(params.locale)).academyId;

    // Must be in academy (or admin)
    const membership = await getAcademyMembership(academyId, me.id);
    if (!membership && me.role !== 'admin') return { success: false, error: 'Unauthorized' };

    const target = await findUserById(params.userId);
    if (!target) return { success: false, error: 'User not found' };

    const isSelf = me.id === params.userId;
    const isParent = me.role === 'parent' && target.parentId === me.id;
    const isPrivileged = me.role === 'admin' || membership?.role === 'manager' || membership?.role === 'coach';

    if (!isSelf && !isParent && !isPrivileged) {
      return { success: false, error: 'Unauthorized' };
    }

    const programIds = Array.from(new Set((params.programIds || []).filter(Boolean)));
    const byProgramId: Record<string, { attended: number; marked: number }> = {};

    for (const programId of programIds) {
      const records = await getProgramAttendanceByUser({ academyId, programId, userId: params.userId });
      let attended = 0;
      let marked = 0;
      for (const r of records) {
        marked += 1;
        if (r.present) attended += 1;
      }
      byProgramId[programId] = { attended, marked };
    }

    return { success: true, byProgramId };
  } catch (error) {
    console.error('Error getting user program attendance summary:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get summary' };
  }
}

export async function getProgramAttendanceForUserInProgramAction(params: {
  locale: string;
  academyId?: string;
  programId: string;
  userId: string;
}): Promise<
  | { success: true; records: Array<{ sessionDate: string; present: boolean }> }
  | { success: false; error: string }
> {
  noStore();
  try {
    const me = await requireAuth(params.locale);
    const academyId = params.academyId ?? (await requireAcademyContext(params.locale)).academyId;

    // Must be in academy (or admin)
    const membership = await getAcademyMembership(academyId, me.id);
    if (!membership && me.role !== 'admin') return { success: false, error: 'Unauthorized' };

    const target = await findUserById(params.userId);
    if (!target) return { success: false, error: 'User not found' };

    // Ensure target is part of this academy (unless global admin).
    if (me.role !== 'admin') {
      const targetMembership = await getAcademyMembership(academyId, params.userId);
      if (!targetMembership) return { success: false, error: 'Unauthorized' };
    }

    const isSelf = me.id === params.userId;
    const isParent = me.role === 'parent' && target.parentId === me.id;
    const isPrivileged = me.role === 'admin' || membership?.role === 'manager' || membership?.role === 'coach';

    if (!isSelf && !isParent && !isPrivileged) {
      return { success: false, error: 'Unauthorized' };
    }

    const program = await findProgramById(params.programId);
    if (!program) return { success: false, error: 'Program not found' };
    if (me.role !== 'admin' && program.academyId !== academyId) {
      return { success: false, error: 'Unauthorized' };
    }

    const raw = await getProgramAttendanceByUser({ academyId, programId: params.programId, userId: params.userId });
    const records = raw
      .map((r) => ({ sessionDate: r.sessionDate, present: !!r.present }))
      .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));

    return { success: true, records };
  } catch (error) {
    console.error('Error getting user program attendance records:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get attendance records' };
  }
}
