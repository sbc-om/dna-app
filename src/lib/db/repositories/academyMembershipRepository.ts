import { getDatabase, generateId } from '../lmdb';

export type AcademyMemberRole = 'manager' | 'coach' | 'parent' | 'kid';

export interface AcademyMembership {
  id: string;
  academyId: string;
  userId: string;
  role: AcademyMemberRole;
  createdAt: string;
  createdBy: string;
}

const MEMBERSHIP_PREFIX = 'academy_membership:'; // academy_membership:{academyId}:{userId}
const USER_INDEX_PREFIX = 'academy_memberships_by_user:'; // academy_memberships_by_user:{userId} => Record<academyId, role>

function membershipKey(academyId: string, userId: string): string {
  return `${MEMBERSHIP_PREFIX}${academyId}:${userId}`;
}

function userIndexKey(userId: string): string {
  return `${USER_INDEX_PREFIX}${userId}`;
}

export async function addUserToAcademy(params: {
  academyId: string;
  userId: string;
  role: AcademyMemberRole;
  createdBy: string;
}): Promise<AcademyMembership> {
  const db = getDatabase();
  const now = new Date().toISOString();

  const existing = await getAcademyMembership(params.academyId, params.userId);
  if (existing) {
    // Update role if changed
    if (existing.role !== params.role) {
      const updated: AcademyMembership = { ...existing, role: params.role };
      await db.put(membershipKey(params.academyId, params.userId), updated);
      await upsertUserIndex(params.userId, params.academyId, params.role);
      return updated;
    }
    return existing;
  }

  const membership: AcademyMembership = {
    id: generateId(),
    academyId: params.academyId,
    userId: params.userId,
    role: params.role,
    createdAt: now,
    createdBy: params.createdBy,
  };

  await db.put(membershipKey(params.academyId, params.userId), membership);
  await upsertUserIndex(params.userId, params.academyId, params.role);

  return membership;
}

export async function removeUserFromAcademy(academyId: string, userId: string): Promise<boolean> {
  const db = getDatabase();
  const existing = await getAcademyMembership(academyId, userId);
  if (!existing) return false;

  await db.remove(membershipKey(academyId, userId));
  await removeFromUserIndex(userId, academyId);
  return true;
}

export async function getAcademyMembership(
  academyId: string,
  userId: string
): Promise<AcademyMembership | null> {
  const db = getDatabase();
  const m = await db.get(membershipKey(academyId, userId));
  return m || null;
}

export async function getUserAcademyRoles(userId: string): Promise<Record<string, AcademyMemberRole>> {
  const db = getDatabase();
  const index = await db.get(userIndexKey(userId));
  return (index as Record<string, AcademyMemberRole>) || {};
}

export async function getUserAcademyIds(userId: string): Promise<string[]> {
  const roles = await getUserAcademyRoles(userId);
  return Object.keys(roles);
}

export async function getUserRoleInAcademy(
  userId: string,
  academyId: string
): Promise<AcademyMemberRole | null> {
  const roles = await getUserAcademyRoles(userId);
  return roles[academyId] || null;
}

export async function listAcademyMembers(academyId: string): Promise<AcademyMembership[]> {
  const db = getDatabase();
  const members: AcademyMembership[] = [];

  const range = db.getRange({
    start: `${MEMBERSHIP_PREFIX}${academyId}:`,
    end: `${MEMBERSHIP_PREFIX}${academyId}:\xFF`,
  });

  for (const { key, value } of range) {
    const keyStr = String(key);
    if (keyStr.startsWith(`${MEMBERSHIP_PREFIX}${academyId}:`) && value) {
      members.push(value as AcademyMembership);
    }
  }

  return members.sort((a, b) => a.userId.localeCompare(b.userId));
}

async function upsertUserIndex(userId: string, academyId: string, role: AcademyMemberRole) {
  const db = getDatabase();
  const existing = (await db.get(userIndexKey(userId))) as Record<string, AcademyMemberRole> | undefined;
  const next: Record<string, AcademyMemberRole> = { ...(existing || {}) };
  next[academyId] = role;
  await db.put(userIndexKey(userId), next);
}

async function removeFromUserIndex(userId: string, academyId: string) {
  const db = getDatabase();
  const existing = (await db.get(userIndexKey(userId))) as Record<string, AcademyMemberRole> | undefined;
  if (!existing) return;
  const next: Record<string, AcademyMemberRole> = { ...existing };
  delete next[academyId];
  await db.put(userIndexKey(userId), next);
}
