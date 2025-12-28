'use server';

import { revalidatePath } from 'next/cache';
import {
  createUser,
  updateUser,
  deleteUser,
  findUserById,
  type CreateUserInput,
  type UpdateUserInput,
} from '@/lib/db/repositories/userRepository';
import { requireRole } from '@/lib/auth/auth';
import { ROLES, type UserRole } from '@/config/roles';
import { requireAcademyContext } from '@/lib/academies/academyContext';
import {
  addUserToAcademy,
  getAcademyMembership,
  getUserAcademyIds,
  removeUserFromAcademy,
  type AcademyMemberRole,
} from '@/lib/db/repositories/academyMembershipRepository';
import { findAcademyById } from '@/lib/db/repositories/academyRepository';

function mapUserRoleToAcademyMemberRole(role: UserRole): AcademyMemberRole {
  switch (role) {
    case ROLES.MANAGER:
      return 'manager';
    case ROLES.COACH:
      return 'coach';
    case ROLES.PARENT:
      return 'parent';
    case ROLES.PLAYER:
      return 'player';
    default:
      // Admin is not an academy member role.
      return 'coach';
  }
}

async function ensureValidAcademyId(academyId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const academy = await findAcademyById(academyId);
  if (!academy || !academy.isActive) {
    return { ok: false, error: 'Invalid academy' };
  }
  return { ok: true };
}

async function setSingleAcademyMembership(params: {
  userId: string;
  academyId: string;
  role: AcademyMemberRole;
  createdBy: string;
}) {
  const existingIds = await getUserAcademyIds(params.userId);
  await Promise.all(
    existingIds
      .filter((id) => id !== params.academyId)
      .map((id) => removeUserFromAcademy(id, params.userId))
  );
  await addUserToAcademy({
    academyId: params.academyId,
    userId: params.userId,
    role: params.role,
    createdBy: params.createdBy,
  });
}

export async function createUserAction(
  input: CreateUserInput,
  options?: {
    locale?: string;
    academyId?: string;
  }
) {
  try {
    const locale = options?.locale ?? 'en';
    await requireRole([ROLES.ADMIN, ROLES.MANAGER], locale);
    const ctx = await requireAcademyContext(locale);

    // Prevent privilege escalation by managers
    if (ctx.user.role === ROLES.MANAGER && (input.role === ROLES.ADMIN || input.role === ROLES.MANAGER)) {
      return { success: false as const, error: 'Not authorized to create this role' };
    }

    const requestedAcademyId = options?.academyId;
    const academyId = ctx.user.role === ROLES.ADMIN ? (requestedAcademyId || ctx.academyId) : ctx.academyId;
    const academyCheck = await ensureValidAcademyId(academyId);
    if (!academyCheck.ok) {
      return { success: false as const, error: academyCheck.error };
    }

    // Registration rules: for player accounts, birth date is required.
    const normalizedInput: CreateUserInput = { ...input };
    if ((normalizedInput.role ?? ROLES.PLAYER) === ROLES.PLAYER) {
      if (!normalizedInput.birthDate) {
        return { success: false as const, error: 'Birth date is required for kids' };
      }

      if (normalizedInput.ageYears === undefined) {
        const dob = new Date(normalizedInput.birthDate);
        if (!Number.isNaN(dob.getTime())) {
          const now = new Date();
          let years = now.getFullYear() - dob.getFullYear();
          const m = now.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) years -= 1;
          normalizedInput.ageYears = Math.max(0, years);
        }
      }
    }

    const user = await createUser(normalizedInput);

    // Attach new users to the current academy (single membership model).
    if (user.role !== ROLES.ADMIN) {
      await setSingleAcademyMembership({
        userId: user.id,
        academyId,
        role: mapUserRoleToAcademyMemberRole(user.role),
        createdBy: ctx.user.id,
      });
    }

    revalidatePath('/[locale]/dashboard/users', 'page');
    return { success: true, user };
  } catch (error) {
    console.error('Create user error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create user' };
  }
}

export async function updateUserAction(
  id: string,
  input: UpdateUserInput,
  options?: {
    locale?: string;
    academyId?: string;
  }
) {
  try {
    const locale = options?.locale ?? 'en';
    await requireRole([ROLES.ADMIN, ROLES.MANAGER], locale);
    const ctx = await requireAcademyContext(locale);

    if (ctx.user.role === ROLES.MANAGER) {
      const membership = await getAcademyMembership(ctx.academyId, id);
      if (!membership) {
        return { success: false as const, error: 'Not authorized' };
      }
      if (input.role === ROLES.ADMIN || input.role === ROLES.MANAGER) {
        return { success: false as const, error: 'Not authorized to set this role' };
      }
    }

    // Registration rules: keep player records consistent.
    const normalizedUpdates: UpdateUserInput = { ...input };
    const existingUser = normalizedUpdates.role === undefined ? await findUserById(id) : null;
    const isPlayer = normalizedUpdates.role === ROLES.PLAYER || (normalizedUpdates.role === undefined && existingUser?.role === ROLES.PLAYER);
    if (isPlayer && normalizedUpdates.birthDate) {
      const dob = new Date(normalizedUpdates.birthDate);
      if (!Number.isNaN(dob.getTime())) {
        const now = new Date();
        let years = now.getFullYear() - dob.getFullYear();
        const m = now.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) years -= 1;
        normalizedUpdates.ageYears = Math.max(0, years);
      }
    }

    const user = await updateUser(id, normalizedUpdates);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Keep academy membership in sync (single membership model).
    if (user.role !== ROLES.ADMIN) {
      const requestedAcademyId = options?.academyId;
      const academyId = ctx.user.role === ROLES.ADMIN ? (requestedAcademyId || (await getUserAcademyIds(user.id))[0] || ctx.academyId) : ctx.academyId;
      const academyCheck = await ensureValidAcademyId(academyId);
      if (!academyCheck.ok) {
        return { success: false as const, error: academyCheck.error };
      }

      await setSingleAcademyMembership({
        userId: user.id,
        academyId,
        role: mapUserRoleToAcademyMemberRole(user.role),
        createdBy: ctx.user.id,
      });
    }

    revalidatePath('/[locale]/dashboard/users', 'page');
    return { success: true, user };
  } catch (error) {
    console.error('Update user error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update user' };
  }
}

export async function deleteUserAction(id: string, options?: { locale?: string }) {
  try {
    const locale = options?.locale ?? 'en';
    await requireRole([ROLES.ADMIN, ROLES.MANAGER], locale);
    const ctx = await requireAcademyContext(locale);

    if (ctx.user.role === ROLES.MANAGER) {
      const membership = await getAcademyMembership(ctx.academyId, id);
      if (!membership) {
        return { success: false as const, error: 'Not authorized' };
      }
    }

    const success = await deleteUser(id);
    if (!success) {
      return { success: false, error: 'User not found' };
    }

    // Clean up academy memberships.
    const academyIds = await getUserAcademyIds(id);
    await Promise.all(academyIds.map((academyId) => removeUserFromAcademy(academyId, id)));

    revalidatePath('/[locale]/dashboard/users', 'page');
    return { success: true };
  } catch (error) {
    console.error('Delete user error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete user' };
  }
}

export async function updateOwnProfileAction(input: {
  fullName?: string;
  phoneNumber?: string;
  profilePicture?: string;
}) {
  try {
    // Import here to avoid circular dependency
    const { getCurrentUser } = await import('@/lib/auth/auth');
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // Users can only update their own profile
    const user = await updateUser(currentUser.id, {
      fullName: input.fullName,
      phoneNumber: input.phoneNumber,
      profilePicture: input.profilePicture,
    });
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Revalidate all dashboard pages to update profile picture everywhere
    revalidatePath('/', 'layout');
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/dashboard/profile');
    
    return { success: true, user };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update profile' };
  }
}

export async function updateUserProfilePictureAction(userId: string, profilePicture: string) {
  'use server';
  
  try {
    const { getCurrentUser } = await import('@/lib/auth/auth');
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // Only admin can update other users' profile pictures
    if (currentUser.role !== 'admin') {
      return { success: false, error: 'Not authorized' };
    }
    
    const user = await updateUser(userId, { profilePicture });
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    revalidatePath(`/dashboard/players/${userId}`);
    revalidatePath('/dashboard/users');
    
    return { success: true, user };
  } catch (error) {
    console.error('Update profile picture error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update profile picture' };
  }
}

export async function getCoachesAction() {
  try {
    const { getCoaches } = await import('@/lib/db/repositories/userRepository');
    const coaches = await getCoaches();
    return { success: true, coaches };
  } catch (error) {
    console.error('Get coaches error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch coaches' };
  }
}

/**
 * Update parent assignments for multiple players
 */
export async function updatePlayersParentAction(
  parentId: string,
  playerIds: string[],
  options?: { locale?: string }
) {
  try {
    const locale = options?.locale ?? 'en';
    await requireRole([ROLES.ADMIN, ROLES.MANAGER], locale);

    // Get all players and update their parentId
    const { getAllUsers } = await import('@/lib/db/repositories/userRepository');
    const allUsers = await getAllUsers();
    const allPlayers = allUsers.filter(u => u.role === ROLES.PLAYER);

    // First, remove this parent from all players
    for (const player of allPlayers) {
      if (player.parentId === parentId) {
        await updateUser(player.id, { parentId: '' });
      }
    }

    // Then, assign this parent to selected players
    for (const playerId of playerIds) {
      await updateUser(playerId, { parentId });
    }

    revalidatePath('/[locale]/dashboard/users', 'page');
    return { success: true as const };
  } catch (error) {
    console.error('Update players parent error:', error);
    return { 
      success: false as const, 
      error: error instanceof Error ? error.message : 'Failed to update players parent' 
    };
  }
}
