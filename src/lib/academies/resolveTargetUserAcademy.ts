import 'server-only';

import { notFound } from 'next/navigation';

import { ROLES, type UserRole } from '@/config/roles';
import {
  getAcademyMembership,
  getUserAcademyIds,
} from '@/lib/db/repositories/academyMembershipRepository';

/**
 * Resolve which academy context should be used when rendering a target user's pages.
 *
 * Why this exists:
 * - Most player data is scoped by (academyId, userId).
 * - Non-admin users must never access a user across academies.
 * - Admins may navigate to a player from outside the currently selected academy;
 *   in that case we prefer the selected academy if the user is a member, otherwise
 *   fall back to one of the academies the user belongs to.
 */
export async function resolveTargetUserAcademyId(params: {
  viewerRole: UserRole;
  preferredAcademyId: string;
  targetUserId: string;
}): Promise<string> {
  const { viewerRole, preferredAcademyId, targetUserId } = params;

  // Non-admin flows are strict: always operate within the selected academy.
  if (viewerRole !== ROLES.ADMIN) {
    return preferredAcademyId;
  }

  // Admin: use the selected academy when it matches the target user's membership.
  const preferredMembership = await getAcademyMembership(preferredAcademyId, targetUserId);
  if (preferredMembership) {
    return preferredAcademyId;
  }

  // Otherwise, use any academy where the target user is a member.
  const academyIds = await getUserAcademyIds(targetUserId);
  const resolved = academyIds.sort()[0];
  if (!resolved) {
    notFound();
  }

  return resolved;
}
