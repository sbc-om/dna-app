'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth/auth';
import { getUserRoleInAcademy, getAcademyMembership } from '@/lib/db/repositories/academyMembershipRepository';
import {
  createDnaAssessmentSession,
  deleteDnaAssessmentSession,
  getDnaAssessmentSessionsByPlayerId,
  getDnaAssessmentSessionsByPlayerInProgram,
  getLatestDnaAssessmentSession,
  updateDnaAssessmentSessionNotes,
  type CreateDnaAssessmentInput,
  type DnaAssessmentSession,
} from '@/lib/db/repositories/dnaAssessmentRepository';

async function assertAcademyAccess(params: {
  locale: string;
  academyId: string;
  targetUserId: string;
}) {
  const user = await requireAuth(params.locale);
  const myRole = await getUserRoleInAcademy(user.id, params.academyId);
  if (!myRole && user.role !== 'admin') {
    throw new Error('Not authorized for this academy');
  }

  if (params.targetUserId !== user.id) {
    const membership = await getAcademyMembership(params.academyId, params.targetUserId);
    if (!membership) {
      throw new Error('User is not part of this academy');
    }
  }

  return { user };
}

export async function createDnaAssessmentAction(params: CreateDnaAssessmentInput & { locale: string }) {
  try {
    const { user } = await assertAcademyAccess({
      locale: params.locale,
      academyId: params.academyId || 'default',
      targetUserId: params.playerId,
    });

    // For now, only admin/coach can create assessments.
    if (user.role !== 'admin' && user.role !== 'coach') {
      throw new Error('Not authorized to create assessments');
    }

    const session = await createDnaAssessmentSession({
      ...params,
      enteredBy: user.id,
    });

    revalidatePath(`/${params.locale}/dashboard/players/${params.playerId}`);
    revalidatePath(`/${params.locale}/dashboard/users/${params.playerId}`);

    return { success: true as const, session };
  } catch (error) {
    console.error('Error creating DNA assessment:', error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to create assessment',
    };
  }
}

export async function getDnaAssessmentsForPlayerAction(params: {
  locale: string;
  academyId: string;
  playerId: string;
  programId?: string;
}) {
  try {
    await assertAcademyAccess({
      locale: params.locale,
      academyId: params.academyId,
      targetUserId: params.playerId,
    });

    const sessions = params.programId
      ? await getDnaAssessmentSessionsByPlayerInProgram({
          academyId: params.academyId,
          programId: params.programId,
          playerId: params.playerId,
        })
      : await getDnaAssessmentSessionsByPlayerId({
          academyId: params.academyId,
          playerId: params.playerId,
        });

    return { success: true as const, sessions };
  } catch (error) {
    console.error('Error getting DNA assessments:', error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to get assessments',
    };
  }
}

export async function updateDnaAssessmentNotesAction(params: {
  locale: string;
  academyId: string;
  playerId: string;
  assessmentId: string;
  notes?: string;
  testNotes?: DnaAssessmentSession['testNotes'];
}) {
  try {
    const { user } = await assertAcademyAccess({
      locale: params.locale,
      academyId: params.academyId,
      targetUserId: params.playerId,
    });

    // Allow admin/coach to write assessment notes.
    if (user.role !== 'admin' && user.role !== 'coach') {
      throw new Error('Not authorized to update assessment notes');
    }

    const updated = await updateDnaAssessmentSessionNotes(params.assessmentId, {
      notes: params.notes,
      testNotes: params.testNotes,
    });

    if (!updated) return { success: false as const, error: 'Assessment not found' };

    revalidatePath(`/${params.locale}/dashboard/players/${params.playerId}`);
    revalidatePath(`/${params.locale}/dashboard/users/${params.playerId}`);

    return { success: true as const, session: updated };
  } catch (error) {
    console.error('Error updating DNA assessment notes:', error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to update assessment notes',
    };
  }
}

export async function getLatestDnaAssessmentForPlayerAction(params: {
  locale: string;
  academyId: string;
  playerId: string;
}) {
  try {
    await assertAcademyAccess({
      locale: params.locale,
      academyId: params.academyId,
      targetUserId: params.playerId,
    });

    const session = await getLatestDnaAssessmentSession({
      academyId: params.academyId,
      playerId: params.playerId,
    });

    return { success: true as const, session };
  } catch (error) {
    console.error('Error getting latest DNA assessment:', error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to get latest assessment',
    };
  }
}

export async function deleteDnaAssessmentAction(params: {
  locale: string;
  academyId: string;
  playerId: string;
  assessmentId: string;
}) {
  try {
    const { user } = await assertAcademyAccess({
      locale: params.locale,
      academyId: params.academyId,
      targetUserId: params.playerId,
    });

    if (user.role !== 'admin') {
      throw new Error('Not authorized to delete assessments');
    }

    const success = await deleteDnaAssessmentSession(params.assessmentId);
    if (!success) {
      return { success: false as const, error: 'Assessment not found' };
    }

    revalidatePath(`/${params.locale}/dashboard/players/${params.playerId}`);
    revalidatePath(`/${params.locale}/dashboard/users/${params.playerId}`);

    return { success: true as const };
  } catch (error) {
    console.error('Error deleting DNA assessment:', error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to delete assessment',
    };
  }
}

export type { DnaAssessmentSession };
