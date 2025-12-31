'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth/auth';
import { getUserRoleInAcademy, getAcademyMembership } from '@/lib/db/repositories/academyMembershipRepository';
import {
  ensurePlayerProfile,
  getPlayerProfile,
  updatePlayerProfile,
  appendPointsEvent,
  grantBadge,
  type PlayerProfile,
} from '@/lib/db/repositories/playerProfileRepository';
import { isKnownBadgeId, type PlayerBadgeId } from '@/lib/player/badges';
import { getLatestDnaAssessmentSession } from '@/lib/db/repositories/dnaAssessmentRepository';

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

  // Ensure the target is part of the academy (unless it is the admin user itself)
  if (params.targetUserId !== user.id) {
    const membership = await getAcademyMembership(params.academyId, params.targetUserId);
    if (!membership) {
      throw new Error('User is not part of this academy');
    }
  }

  return { user, myRole };
}

export async function getPlayerProfileAction(params: {
  locale: string;
  academyId: string;
  userId: string;
}) {
  try {
    await assertAcademyAccess({ locale: params.locale, academyId: params.academyId, targetUserId: params.userId });

    const profile = await getPlayerProfile(params.academyId, params.userId);
    return { success: true as const, profile };
  } catch (error) {
    console.error('Error getting player profile:', error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to get player profile',
    };
  }
}

export async function ensurePlayerProfileAction(params: {
  locale: string;
  academyId: string;
  userId: string;
}) {
  try {
    await assertAcademyAccess({ locale: params.locale, academyId: params.academyId, targetUserId: params.userId });
    const profile = await ensurePlayerProfile({ academyId: params.academyId, userId: params.userId });

    return { success: true as const, profile };
  } catch (error) {
    console.error('Error ensuring player profile:', error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to ensure player profile',
    };
  }
}

export async function grantPlayerBadgeAction(params: {
  locale: string;
  academyId: string;
  userId: string;
  badgeId: string;
  notes?: string;
}) {
  try {
    const { user } = await assertAcademyAccess({
      locale: params.locale,
      academyId: params.academyId,
      targetUserId: params.userId,
    });

    // Only admin/coach can grant badges
    if (user.role !== 'admin' && user.role !== 'coach') {
      throw new Error('Not authorized to grant badges');
    }

    if (!isKnownBadgeId(params.badgeId)) {
      throw new Error('Unknown badge');
    }

    let profile = await grantBadge({
      academyId: params.academyId,
      userId: params.userId,
      badgeId: params.badgeId as PlayerBadgeId,
      grantedBy: user.id,
      notes: params.notes,
    });

    profile = await appendPointsEvent({
      academyId: params.academyId,
      userId: params.userId,
      event: {
        type: 'badge_granted',
        points: 10,
        createdBy: user.id,
        meta: { badgeId: params.badgeId },
      },
    });

    revalidatePath(`/${params.locale}/dashboard/players/${params.userId}`);
    revalidatePath(`/${params.locale}/dashboard/users/${params.userId}`);

    return { success: true as const, profile };
  } catch (error) {
    console.error('Error granting player badge:', error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to grant badge',
    };
  }
}

export async function setPlayerIdentityAction(params: {
  locale: string;
  academyId: string;
  userId: string;
  identityKey: string | null;
}) {
  try {
    const { user } = await assertAcademyAccess({
      locale: params.locale,
      academyId: params.academyId,
      targetUserId: params.userId,
    });

    // Only admin/coach can set identity
    if (user.role !== 'admin' && user.role !== 'coach') {
      throw new Error('Not authorized to set identity');
    }

    const profile = await updatePlayerProfile(params.academyId, params.userId, {
      identityKey: params.identityKey || undefined,
    });

    revalidatePath(`/${params.locale}/dashboard/players/${params.userId}`);
    revalidatePath(`/${params.locale}/dashboard/users/${params.userId}`);

    return { success: true as const, profile };
  } catch (error) {
    console.error('Error setting player identity:', error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to set identity',
    };
  }
}

export async function syncPlayerProfileAfterAssessmentAction(params: {
  locale: string;
  academyId: string;
  userId: string;
}) {
  try {
    const { user } = await assertAcademyAccess({
      locale: params.locale,
      academyId: params.academyId,
      targetUserId: params.userId,
    });

    // Assessment creation is currently admin-only in the UI, but allow coach too.
    if (user.role !== 'admin' && user.role !== 'coach') {
      throw new Error('Not authorized to sync assessments');
    }

    const assessment = await getLatestDnaAssessmentSession({ academyId: params.academyId, playerId: params.userId });

    let profile = await ensurePlayerProfile({ academyId: params.academyId, userId: params.userId });

    const now = new Date().toISOString();
    const hasAssessmentBefore = profile.lastAssessmentAt !== undefined;

    const nextStatus: PlayerProfile['assessmentStatus'] = hasAssessmentBefore
      ? 'reassessment'
      : 'first_assessment_completed';

    profile = await updatePlayerProfile(params.academyId, params.userId, {
      assessmentStatus: nextStatus,
      lastAssessmentAt: now,
    });

    profile = await appendPointsEvent({
      academyId: params.academyId,
      userId: params.userId,
      event: {
        type: hasAssessmentBefore ? 'reassessment' : 'first_assessment',
        points: hasAssessmentBefore ? 20 : 50,
        createdBy: user.id,
      },
    });

    revalidatePath(`/${params.locale}/dashboard/players/${params.userId}`);
    revalidatePath(`/${params.locale}/dashboard/users/${params.userId}`);

    return { success: true as const, profile, assessment };
  } catch (error) {
    console.error('Error syncing player profile after assessment:', error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to sync player profile',
    };
  }
}
