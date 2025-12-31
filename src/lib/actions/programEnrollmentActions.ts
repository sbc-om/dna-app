'use server';

import { unstable_noStore as noStore, revalidatePath } from 'next/cache';
import { requireAcademyContext } from '@/lib/academies/academyContext';
import { requireAuth } from '@/lib/auth/auth';
import { listAcademyMembers, getAcademyMembership } from '@/lib/db/repositories/academyMembershipRepository';
import { findUserById, getUsersByIds } from '@/lib/db/repositories/userRepository';
import { hasRolePermission } from '@/lib/db/repositories/rolePermissionRepository';
import { findProgramById } from '@/lib/db/repositories/programRepository';
import { findProgramLevelById, getProgramLevelsByProgramIdAndAcademyId } from '@/lib/db/repositories/programLevelRepository';
import {
  upsertProgramEnrollment,
  removeProgramEnrollment,
  listProgramEnrollmentsByProgram,
  listProgramEnrollmentsByUser,
  appendProgramCoachNote,
  updateProgramEnrollment,
  type ProgramEnrollment,
  type ProgramLevelHistoryEntry,
} from '@/lib/db/repositories/programEnrollmentRepository';

function computeNextLevelHistory(params: {
  existingHistory: ProgramLevelHistoryEntry[];
  previousLevelId?: string;
  nextLevelId?: string;
  actorUserId: string;
  comment?: string;
  pointsDelta?: number;
  nowIso?: string;
}): ProgramLevelHistoryEntry[] {
  const now = params.nowIso ?? new Date().toISOString();
  const history = Array.isArray(params.existingHistory) ? [...params.existingHistory] : [];

  const prev = params.previousLevelId;
  const next = params.nextLevelId;

  // No-op if unchanged.
  if ((prev ?? undefined) === (next ?? undefined)) return history;

  // Close any currently-open entry for the previous level.
  if (prev) {
    for (let i = history.length - 1; i >= 0; i--) {
      const entry = history[i];
      if (entry?.levelId === prev && !entry.endedAt) {
        history[i] = {
          ...entry,
          endedAt: now,
        };
        break;
      }
    }
  }

  // Start new entry (if we set a new level).
  if (next) {
    history.push({
      levelId: next,
      startedAt: now,
      setBy: params.actorUserId,
      comment: params.comment,
      pointsDelta: params.pointsDelta,
    });
  }

  return history;
}

async function canManageProgramsForRole(role: Parameters<typeof hasRolePermission>[0]) {
  return hasRolePermission(role, 'canManagePrograms');
}

async function canAccessProgramsForRole(role: Parameters<typeof hasRolePermission>[0]) {
  const canManage = await hasRolePermission(role, 'canManagePrograms');
  if (canManage) return true;
  return hasRolePermission(role, 'canCoachPrograms');
}

export async function getAcademyPlayersForProgramsAction(locale: string = 'en') {
  noStore();
  const ctx = await requireAcademyContext(locale);
  const allowed = await canManageProgramsForRole(ctx.user.role);
  if (!allowed) return { success: false as const, error: 'Unauthorized' };

  try {
    const members = await listAcademyMembers(ctx.academyId);
    const playerIds = members.filter((m) => m.role === 'player').map((m) => m.userId);
    const users = await getUsersByIds(playerIds);
    const players = users.filter((u) => u.isActive);
    return { success: true as const, players };
  } catch (error) {
    console.error('Error getting academy players:', error);
    return { success: false as const, error: 'Failed to get players' };
  }
}

export async function listProgramMembersAction(programId: string, locale: string = 'en') {
  noStore();
  const ctx = await requireAcademyContext(locale);
  const allowed = await canManageProgramsForRole(ctx.user.role);
  if (!allowed) return { success: false as const, error: 'Unauthorized' };

  try {
    const program = await findProgramById(programId);
    if (!program) return { success: false as const, error: 'Program not found' };
    if (ctx.user.role !== 'admin' && program.academyId !== ctx.academyId) {
      return { success: false as const, error: 'Unauthorized' };
    }

    const enrollments = await listProgramEnrollmentsByProgram({ academyId: ctx.academyId, programId });
    const userIds = enrollments.map((e) => e.userId);
    const users = await getUsersByIds(userIds);

    const enriched = await Promise.all(
      enrollments.map(async (e) => {
        const user = users.find((u) => u.id === e.userId) || null;
        const level = e.currentLevelId ? await findProgramLevelById(e.currentLevelId) : null;
        return { ...e, user, currentLevel: level };
      })
    );

    return { success: true as const, members: enriched };
  } catch (error) {
    console.error('Error getting program members:', error);
    return { success: false as const, error: 'Failed to get members' };
  }
}

export async function listProgramMembersForCoachAction(programId: string, locale: string = 'en') {
  noStore();
  const ctx = await requireAcademyContext(locale);
  const allowedByRolePerm = await canAccessProgramsForRole(ctx.user.role);
  if (!allowedByRolePerm) return { success: false as const, error: 'Unauthorized' };

  // Additionally require academy membership for non-admin.
  const myMembership = await getAcademyMembership(ctx.academyId, ctx.user.id);
  const canCoach = ctx.user.role === 'admin' || myMembership?.role === 'coach' || myMembership?.role === 'manager';
  if (!canCoach) return { success: false as const, error: 'Unauthorized' };

  try {
    const program = await findProgramById(programId);
    if (!program) return { success: false as const, error: 'Program not found' };
    if (ctx.user.role !== 'admin' && program.academyId !== ctx.academyId) {
      return { success: false as const, error: 'Unauthorized' };
    }

    const enrollments = await listProgramEnrollmentsByProgram({ academyId: ctx.academyId, programId });
    const userIds = enrollments.map((e) => e.userId);
    const users = await getUsersByIds(userIds);

    const enriched = await Promise.all(
      enrollments.map(async (e) => {
        const user = users.find((u) => u.id === e.userId) || null;
        const level = e.currentLevelId ? await findProgramLevelById(e.currentLevelId) : null;
        return { ...e, user, currentLevel: level };
      })
    );

    return { success: true as const, members: enriched };
  } catch (error) {
    console.error('Error getting program members for coach:', error);
    return { success: false as const, error: 'Failed to get members' };
  }
}

export async function addPlayerToProgramAction(params: {
  programId: string;
  userId: string;
  currentLevelId?: string;
  locale?: string;
}) {
  const locale = params.locale ?? 'en';
  const ctx = await requireAcademyContext(locale);
  const allowed = await canManageProgramsForRole(ctx.user.role);
  if (!allowed) return { success: false as const, error: 'Unauthorized' };

  try {
    const program = await findProgramById(params.programId);
    if (!program) return { success: false as const, error: 'Program not found' };
    if (ctx.user.role !== 'admin' && program.academyId !== ctx.academyId) {
      return { success: false as const, error: 'Unauthorized' };
    }

    // Ensure target user is in the academy as player
    const membership = await getAcademyMembership(ctx.academyId, params.userId);
    if (!membership || membership.role !== 'player') {
      return { success: false as const, error: 'User is not a player in this academy' };
    }

    const enrollment = await upsertProgramEnrollment({
      academyId: ctx.academyId,
      programId: params.programId,
      userId: params.userId,
      currentLevelId: params.currentLevelId,
    });

    revalidatePath(`/${locale}/dashboard/programs/members`, 'page');
    revalidatePath(`/${locale}/dashboard/players/${params.userId}`, 'page');

    return { success: true as const, enrollment };
  } catch (error) {
    console.error('Error adding player to program:', error);
    return { success: false as const, error: 'Failed to add player' };
  }
}

export async function removePlayerFromProgramAction(params: {
  programId: string;
  userId: string;
  locale?: string;
}) {
  const locale = params.locale ?? 'en';
  const ctx = await requireAcademyContext(locale);
  const allowed = await canManageProgramsForRole(ctx.user.role);
  if (!allowed) return { success: false as const, error: 'Unauthorized' };

  try {
    const ok = await removeProgramEnrollment({ academyId: ctx.academyId, programId: params.programId, userId: params.userId });
    if (!ok) return { success: false as const, error: 'Not found' };

    revalidatePath(`/${locale}/dashboard/programs/members`, 'page');
    revalidatePath(`/${locale}/dashboard/players/${params.userId}`, 'page');

    return { success: true as const };
  } catch (error) {
    console.error('Error removing player from program:', error);
    return { success: false as const, error: 'Failed to remove player' };
  }
}

export async function getPlayerProgramEnrollmentsAction(params: {
  locale: string;
  academyId: string;
  userId: string;
}) {
  noStore();
  try {
    const me = await requireAuth(params.locale);

    // Must be in academy (or admin)
    const myMembership = await getAcademyMembership(params.academyId, me.id);
    if (!myMembership && me.role !== 'admin') {
      return { success: false as const, error: 'Unauthorized' };
    }

    // Allow: admin/manager/coach, or self (player), or parent of the player
    const target = await findUserById(params.userId);
    if (!target) return { success: false as const, error: 'User not found' };

    const isSelf = me.id === params.userId;
    const isPrivileged = me.role === 'admin' || myMembership?.role === 'manager' || myMembership?.role === 'coach';
    const isParent = me.role === 'parent' && target.parentId === me.id;

    if (!isSelf && !isPrivileged && !isParent) {
      return { success: false as const, error: 'Unauthorized' };
    }

    const enrollments = await listProgramEnrollmentsByUser({ academyId: params.academyId, userId: params.userId });

    const enriched = await Promise.all(
      enrollments.map(async (e) => {
        const program = await findProgramById(e.programId);
        const currentLevel = e.currentLevelId ? await findProgramLevelById(e.currentLevelId) : null;
        return { ...e, program, currentLevel };
      })
    );

    return { success: true as const, enrollments: enriched };
  } catch (error) {
    console.error('Error getting player program enrollments:', error);
    return { success: false as const, error: 'Failed to get programs' };
  }
}

export async function addCoachNoteToProgramPlayerAction(params: {
  locale: string;
  academyId?: string;
  programId: string;
  userId: string;
  pointsDelta?: number;
  comment?: string;
}) {
  const me = await requireAuth(params.locale);

  const academyId = params.academyId ?? (await requireAcademyContext(params.locale)).academyId;

  // Coaches & managers & admin only
  const myMembership = await getAcademyMembership(academyId, me.id);
  const canCoach = me.role === 'admin' || myMembership?.role === 'coach' || myMembership?.role === 'manager';
  if (!canCoach) return { success: false as const, error: 'Unauthorized' };

  try {
    const updated = await appendProgramCoachNote({
      academyId,
      programId: params.programId,
      userId: params.userId,
      note: {
        coachUserId: me.id,
        pointsDelta: params.pointsDelta,
        comment: params.comment,
      },
    });

    if (!updated) return { success: false as const, error: 'Enrollment not found' };

    revalidatePath(`/${params.locale}/dashboard/players/${params.userId}`, 'page');
    return { success: true as const, enrollment: updated };
  } catch (error) {
    console.error('Error adding coach note:', error);
    return { success: false as const, error: 'Failed to add note' };
  }
}

export async function getProgramLevelsForProgramAction(params: {
  locale: string;
  academyId?: string;
  programId: string;
}) {
  noStore();
  const me = await requireAuth(params.locale);

  const academyId = params.academyId ?? (await requireAcademyContext(params.locale)).academyId;

  // Admin OR academy manager only.
  const myMembership = await getAcademyMembership(academyId, me.id);
  const canManage = me.role === 'admin' || myMembership?.role === 'manager';
  if (!canManage) return { success: false as const, error: 'Unauthorized' };

  try {
    const program = await findProgramById(params.programId);
    if (!program) return { success: false as const, error: 'Program not found' };
    if (me.role !== 'admin' && program.academyId !== academyId) {
      return { success: false as const, error: 'Unauthorized' };
    }

    const levels = await getProgramLevelsByProgramIdAndAcademyId(params.programId, academyId);
    return { success: true as const, levels };
  } catch (error) {
    console.error('Error getting program levels for program:', error);
    return { success: false as const, error: 'Failed to get levels' };
  }
}

export async function getProgramLevelsForPlayerProgramAction(params: {
  locale: string;
  academyId: string;
  programId: string;
  userId: string;
}) {
  noStore();
  try {
    const me = await requireAuth(params.locale);

    // Must be in academy (or admin)
    const myMembership = await getAcademyMembership(params.academyId, me.id);
    if (!myMembership && me.role !== 'admin') {
      return { success: false as const, error: 'Unauthorized' };
    }

    // Allow: admin/manager/coach, or self (player), or parent of the player.
    const target = await findUserById(params.userId);
    if (!target) return { success: false as const, error: 'User not found' };

    const isSelf = me.id === params.userId;
    const isPrivileged = me.role === 'admin' || myMembership?.role === 'manager' || myMembership?.role === 'coach';
    const isParent = me.role === 'parent' && target.parentId === me.id;

    if (!isSelf && !isPrivileged && !isParent) {
      return { success: false as const, error: 'Unauthorized' };
    }

    const program = await findProgramById(params.programId);
    if (!program) return { success: false as const, error: 'Program not found' };
    if (me.role !== 'admin' && program.academyId !== params.academyId) {
      return { success: false as const, error: 'Unauthorized' };
    }

    const levels = await getProgramLevelsByProgramIdAndAcademyId(params.programId, params.academyId);
    return { success: true as const, levels };
  } catch (error) {
    console.error('Error getting program levels for player:', error);
    return { success: false as const, error: 'Failed to get levels' };
  }
}

export async function setPlayerProgramLevelAction(params: {
  locale: string;
  academyId?: string;
  programId: string;
  userId: string;
  nextLevelId?: string | null;
  pointsDelta?: number;
  comment?: string;
}) {
  const me = await requireAuth(params.locale);
  const academyId = params.academyId ?? (await requireAcademyContext(params.locale)).academyId;

  // Admin OR academy manager only.
  const myMembership = await getAcademyMembership(academyId, me.id);
  const canManage = me.role === 'admin' || myMembership?.role === 'manager';
  if (!canManage) return { success: false as const, error: 'Unauthorized' };

  try {
    const program = await findProgramById(params.programId);
    if (!program) return { success: false as const, error: 'Program not found' };
    if (me.role !== 'admin' && program.academyId !== academyId) {
      return { success: false as const, error: 'Unauthorized' };
    }

    // Ensure target is a player in this academy.
    const targetMembership = await getAcademyMembership(academyId, params.userId);
    if (!targetMembership || targetMembership.role !== 'player') {
      return { success: false as const, error: 'User is not a player in this academy' };
    }

    // Validate level (if any).
    const nextLevelId = params.nextLevelId ?? undefined;
    if (nextLevelId) {
      const lvl = await findProgramLevelById(nextLevelId);
      if (!lvl) return { success: false as const, error: 'Level not found' };
      if (lvl.programId !== params.programId) return { success: false as const, error: 'Level does not belong to program' };
      if (me.role !== 'admin' && lvl.academyId !== academyId) return { success: false as const, error: 'Unauthorized' };
    }

    const existingEnrollment = await upsertProgramEnrollment({
      academyId,
      programId: params.programId,
      userId: params.userId,
    });

    const points = params.pointsDelta;
    const userComment = (params.comment ?? '').trim();
    const auditComment = userComment || `Manual program level set to ${nextLevelId ?? 'none'}`;

    const nextHistory = computeNextLevelHistory({
      existingHistory: existingEnrollment.levelHistory,
      previousLevelId: existingEnrollment.currentLevelId,
      nextLevelId,
      actorUserId: me.id,
      comment: auditComment,
      pointsDelta: typeof points === 'number' && Number.isFinite(points) ? points : undefined,
    });

    const updated = await updateProgramEnrollment({
      academyId,
      programId: params.programId,
      userId: params.userId,
      updates: {
        currentLevelId: nextLevelId,
        levelHistory: nextHistory,
      },
    });

    if (!updated) return { success: false as const, error: 'Enrollment not found' };

    const withNote = await appendProgramCoachNote({
      academyId,
      programId: params.programId,
      userId: params.userId,
      note: {
        coachUserId: me.id,
        pointsDelta: points,
        comment: auditComment,
      },
    });

    revalidatePath(`/${params.locale}/dashboard/players/${params.userId}`, 'page');
    revalidatePath(`/${params.locale}/dashboard/users/${params.userId}`, 'page');
    revalidatePath(`/${params.locale}/dashboard/programs/members`, 'page');

    return { success: true as const, enrollment: withNote ?? updated };
  } catch (error) {
    console.error('Error setting player program level:', error);
    return { success: false as const, error: 'Failed to update program level' };
  }
}

export type ProgramMemberRow = Awaited<ReturnType<typeof listProgramMembersAction>> extends { success: true; members: infer M }
  ? M extends Array<infer R>
    ? R
    : never
  : never;

export type ProgramCoachMemberRow = Awaited<ReturnType<typeof listProgramMembersForCoachAction>> extends { success: true; members: infer M }
  ? M extends Array<infer R>
    ? R
    : never
  : never;

export type PlayerProgramEnrollmentRow = Awaited<ReturnType<typeof getPlayerProgramEnrollmentsAction>> extends { success: true; enrollments: infer E }
  ? E extends Array<infer R>
    ? R
    : never
  : never;

export type ProgramEnrollmentRecord = ProgramEnrollment;
