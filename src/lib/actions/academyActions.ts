'use server';

import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { requireAdmin } from '@/lib/auth/auth';
import {
  createUser,
  findUserByEmail,
  findUserById,
  listUsers,
  updateUser,
  type CreateUserInput,
} from '@/lib/db/repositories/userRepository';
import { ROLES } from '@/config/roles';
import {
  createAcademy,
  getAllAcademies,
  updateAcademy,
  type CreateAcademyInput,
  type UpdateAcademyInput,
  ensureDefaultAcademyExists,
} from '@/lib/db/repositories/academyRepository';
import {
  addUserToAcademy,
  getUserAcademyIds,
  listAcademyMembers,
  type AcademyMembership,
} from '@/lib/db/repositories/academyMembershipRepository';
import { requireAcademyContext, setSelectedAcademyIdCookie } from '@/lib/academies/academyContext';

type AcademyManagerSummary = {
  userId: string;
  email: string;
  username: string;
  fullName?: string;
  role: string;
};

export async function getAllAcademiesAction() {
  noStore();
  try {
    await requireAdmin();
    await ensureDefaultAcademyExists('system');
    const academies = await getAllAcademies();

    const managersByAcademyId: Record<string, AcademyManagerSummary | null> = {};
    for (const academy of academies) {
      const members = await listAcademyMembers(academy.id);
      const manager = members.find((m) => m.role === 'manager');
      if (!manager) {
        managersByAcademyId[academy.id] = null;
        continue;
      }

      const u = await findUserById(manager.userId);
      if (!u) {
        managersByAcademyId[academy.id] = null;
        continue;
      }

      managersByAcademyId[academy.id] = { userId: u.id, email: u.email, username: u.username, fullName: u.fullName, role: u.role };
    }

    return { success: true as const, academies, managersByAcademyId };
  } catch (error) {
    console.error('Get academies error:', error);
    return { success: false as const, error: 'Failed to load academies' };
  }
}

export async function getEligibleAcademyManagersAction() {
  noStore();
  try {
    await requireAdmin();

    const users = await listUsers();
    const eligible = users
      .filter((u) => u.isActive)
      .filter((u) => u.role === ROLES.ADMIN || u.role === ROLES.MANAGER)
      .map((u) => ({
        id: u.id,
        email: u.email,
        username: u.username,
        fullName: u.fullName,
        role: u.role,
      }));

    return { success: true as const, users: eligible };
  } catch (error) {
    console.error('Get eligible managers error:', error);
    return { success: false as const, error: 'Failed to load eligible managers' };
  }
}

export async function assignExistingAcademyManagerAction(params: { academyId: string; userId: string }) {
  try {
    const admin = await requireAdmin();
    await ensureDefaultAcademyExists('system');

    const user = await findUserById(params.userId);
    if (!user) {
      return { success: false as const, error: 'User not found' };
    }
    if (user.role !== ROLES.ADMIN && user.role !== ROLES.MANAGER) {
      return { success: false as const, error: 'User must have admin or manager role' };
    }

    const membership: AcademyMembership = await addUserToAcademy({
      academyId: params.academyId,
      userId: user.id,
      role: 'manager',
      createdBy: admin.id,
    });

    revalidatePath('/[locale]/dashboard/academies', 'page');
    revalidatePath('/[locale]/dashboard/settings', 'page');
    return {
      success: true as const,
      user: { id: user.id, email: user.email, username: user.username, fullName: user.fullName, role: user.role },
      membership,
    };
  } catch (error) {
    console.error('Assign existing academy manager error:', error);
    return { success: false as const, error: 'Failed to assign manager' };
  }
}

export async function createAcademyAction(input: CreateAcademyInput) {
  try {
    const admin = await requireAdmin();
    await ensureDefaultAcademyExists('system');
    const academy = await createAcademy(input, admin.id);
    revalidatePath('/[locale]/dashboard/settings', 'page');
    return { success: true as const, academy };
  } catch (error) {
    console.error('Create academy error:', error);
    return { success: false as const, error: 'Failed to create academy' };
  }
}

export async function updateAcademyAction(id: string, input: UpdateAcademyInput) {
  try {
    await requireAdmin();
    const academy = await updateAcademy(id, input);
    if (!academy) {
      return { success: false as const, error: 'Academy not found' };
    }

    revalidatePath('/[locale]/dashboard/settings', 'page');
    return { success: true as const, academy };
  } catch (error) {
    console.error('Update academy error:', error);
    return { success: false as const, error: 'Failed to update academy' };
  }
}

export async function createOrAssignAcademyManagerAction(params: {
  academyId: string;
  managerEmail: string;
  managerUsername?: string;
  managerPassword?: string;
  managerFullName?: string;
  promoteExistingToManager?: boolean;
}) {
  try {
    const admin = await requireAdmin();
    const email = params.managerEmail.toLowerCase().trim();
    if (!email) return { success: false as const, error: 'Manager email is required' };

    let user = await findUserByEmail(email);

    // Create manager user if not exists
    if (!user) {
      if (!params.managerPassword || !params.managerUsername) {
        return {
          success: false as const,
          error: 'To create a new manager, username and password are required',
        };
      }

      const input: CreateUserInput = {
        email,
        username: params.managerUsername,
        password: params.managerPassword,
        fullName: params.managerFullName,
        role: ROLES.MANAGER,
      };

      user = await createUser(input);
    } else {
      // Promote existing user to MANAGER if requested (default: true)
      const promote = params.promoteExistingToManager !== false;
      if (promote && user.role !== ROLES.ADMIN && user.role !== ROLES.MANAGER) {
        const updated = await updateUser(user.id, { role: ROLES.MANAGER });
        if (updated) {
          user = updated;
        }
      }
    }

    const membership: AcademyMembership = await addUserToAcademy({
      academyId: params.academyId,
      userId: user.id,
      role: 'manager',
      createdBy: admin.id,
    });

    revalidatePath('/[locale]/dashboard/settings', 'page');
    return { success: true as const, user, membership };
  } catch (error) {
    console.error('Assign academy manager error:', error);
    return { success: false as const, error: 'Failed to assign manager' };
  }
}

export async function getMyAcademiesAction(locale: string = 'en') {
  noStore();
  try {
    const ctx = await requireAcademyContext(locale);

    if (ctx.user.role === ROLES.ADMIN) {
      const academies = await getAllAcademies();
      return { success: true as const, academies, currentAcademyId: ctx.academyId };
    }

    const academyIds = await getUserAcademyIds(ctx.user.id);
    const all = await getAllAcademies();
    const academies = all.filter((a) => academyIds.includes(a.id));

    return { success: true as const, academies, currentAcademyId: ctx.academyId };
  } catch (error) {
    console.error('Get my academies error:', error);
    return { success: false as const, error: 'Failed to load academies' };
  }
}

export async function setCurrentAcademyAction(locale: string, academyId: string) {
  try {
    // Must be authenticated and allowed to access the academy
    const ctx = await requireAcademyContext(locale);

    if (ctx.user.role !== ROLES.ADMIN) {
      const allowed = (await getUserAcademyIds(ctx.user.id)).includes(academyId);
      if (!allowed) {
        return { success: false as const, error: 'Not allowed for this academy' };
      }
    }

    await setSelectedAcademyIdCookie(academyId);
    revalidatePath('/', 'layout');
    return { success: true as const };
  } catch (error) {
    console.error('Set current academy error:', error);
    return { success: false as const, error: 'Failed to set current academy' };
  }
}
