import 'server-only';

import { notFound } from 'next/navigation';
import { getAcademyMembership } from '@/lib/db/repositories/academyMembershipRepository';

/**
 * Ensures the given user is a member of the given academy.
 *
 * Use this to prevent cross-academy data leaks when working with global user IDs.
 */
export async function requireUserInAcademy(params: {
  academyId: string;
  userId: string;
}): Promise<void> {
  const membership = await getAcademyMembership(params.academyId, params.userId);
  if (!membership) {
    notFound();
  }
}

export async function isUserInAcademy(params: {
  academyId: string;
  userId: string;
}): Promise<boolean> {
  const membership = await getAcademyMembership(params.academyId, params.userId);
  return Boolean(membership);
}
