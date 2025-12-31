'use server';

import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { requireAcademyContext } from '../academies/academyContext';
import { hasRolePermission } from '../db/repositories/rolePermissionRepository';
import {
  createProgram,
  deleteProgram,
  findProgramById,
  getProgramsByAcademyId,
  updateProgram,
  type CreateProgramInput,
  type UpdateProgramInput,
} from '../db/repositories/programRepository';
import {
  createProgramLevel,
  deleteProgramLevel,
  deleteProgramLevelsByProgramId,
  findProgramLevelById,
  getProgramLevelsByProgramIdAndAcademyId,
  moveProgramLevel,
  updateProgramLevel,
  type CreateProgramLevelInput,
  type UpdateProgramLevelInput,
} from '../db/repositories/programLevelRepository';

async function canManageProgramsForRole(role: Parameters<typeof hasRolePermission>[0]): Promise<boolean> {
  return hasRolePermission(role, 'canManagePrograms');
}

async function canAccessProgramsForRole(role: Parameters<typeof hasRolePermission>[0]): Promise<boolean> {
  const canManage = await hasRolePermission(role, 'canManagePrograms');
  if (canManage) return true;
  return hasRolePermission(role, 'canCoachPrograms');
}

export async function getProgramsAction(locale: string = 'en') {
  noStore();
  const ctx = await requireAcademyContext(locale);
  const allowed = await canAccessProgramsForRole(ctx.user.role);
  if (!allowed) return { success: false, error: 'Unauthorized' };

  try {
    const programs = await getProgramsByAcademyId(ctx.academyId);
    return { success: true, programs };
  } catch (error) {
    console.error('Error getting programs:', error);
    return { success: false, error: 'Failed to get programs' };
  }
}

export async function createProgramAction(input: CreateProgramInput, locale: string = 'en') {
  const ctx = await requireAcademyContext(locale);
  const allowed = await canManageProgramsForRole(ctx.user.role);
  if (!allowed) return { success: false, error: 'Unauthorized' };

  try {
    const program = await createProgram({ ...input, academyId: ctx.academyId });
    revalidatePath(`/${locale}/dashboard/programs`, 'page');
    return { success: true, program };
  } catch (error) {
    console.error('Error creating program:', error);
    return { success: false, error: 'Failed to create program' };
  }
}

export async function updateProgramAction(id: string, updates: UpdateProgramInput, locale: string = 'en') {
  const ctx = await requireAcademyContext(locale);
  const allowed = await canManageProgramsForRole(ctx.user.role);
  if (!allowed) return { success: false, error: 'Unauthorized' };

  try {
    const existing = await findProgramById(id);
    if (!existing) return { success: false, error: 'Program not found' };
    if (ctx.user.role !== 'admin' && existing.academyId !== ctx.academyId) {
      return { success: false, error: 'Unauthorized' };
    }

    const program = await updateProgram(id, updates);
    if (!program) return { success: false, error: 'Program not found' };

    revalidatePath(`/${locale}/dashboard/programs`, 'page');
    return { success: true, program };
  } catch (error) {
    console.error('Error updating program:', error);
    return { success: false, error: 'Failed to update program' };
  }
}

export async function deleteProgramAction(id: string, locale: string = 'en') {
  const ctx = await requireAcademyContext(locale);
  const allowed = await canManageProgramsForRole(ctx.user.role);
  if (!allowed) return { success: false, error: 'Unauthorized' };

  try {
    const existing = await findProgramById(id);
    if (!existing) return { success: false, error: 'Program not found' };
    if (ctx.user.role !== 'admin' && existing.academyId !== ctx.academyId) {
      return { success: false, error: 'Unauthorized' };
    }

    await deleteProgramLevelsByProgramId(id);
    const deleted = await deleteProgram(id);
    if (!deleted) return { success: false, error: 'Program not found' };

    revalidatePath(`/${locale}/dashboard/programs`, 'page');
    return { success: true };
  } catch (error) {
    console.error('Error deleting program:', error);
    return { success: false, error: 'Failed to delete program' };
  }
}

export async function getProgramLevelsAction(programId: string, locale: string = 'en') {
  noStore();
  const ctx = await requireAcademyContext(locale);
  const allowed = await canAccessProgramsForRole(ctx.user.role);
  if (!allowed) return { success: false, error: 'Unauthorized' };

  try {
    const levels = await getProgramLevelsByProgramIdAndAcademyId(programId, ctx.academyId);
    return { success: true, levels };
  } catch (error) {
    console.error('Error getting program levels:', error);
    return { success: false, error: 'Failed to get levels' };
  }
}

export async function createProgramLevelAction(input: Omit<CreateProgramLevelInput, 'academyId'>, locale: string = 'en') {
  const ctx = await requireAcademyContext(locale);
  const allowed = await canManageProgramsForRole(ctx.user.role);
  if (!allowed) return { success: false, error: 'Unauthorized' };

  try {
    const program = await findProgramById(input.programId);
    if (!program) return { success: false, error: 'Program not found' };
    if (ctx.user.role !== 'admin' && program.academyId !== ctx.academyId) {
      return { success: false, error: 'Unauthorized' };
    }

    const level = await createProgramLevel({ ...input, academyId: ctx.academyId });
    revalidatePath(`/${locale}/dashboard/programs`, 'page');
    return { success: true, level };
  } catch (error) {
    console.error('Error creating program level:', error);
    return { success: false, error: 'Failed to create level' };
  }
}

export async function updateProgramLevelAction(id: string, updates: UpdateProgramLevelInput, locale: string = 'en') {
  const ctx = await requireAcademyContext(locale);
  const allowed = await canManageProgramsForRole(ctx.user.role);
  if (!allowed) return { success: false, error: 'Unauthorized' };

  try {
    const existing = await findProgramLevelById(id);
    if (!existing) return { success: false, error: 'Level not found' };
    if (ctx.user.role !== 'admin' && existing.academyId !== ctx.academyId) {
      return { success: false, error: 'Unauthorized' };
    }

    const level = await updateProgramLevel(id, updates);
    if (!level) return { success: false, error: 'Level not found' };

    revalidatePath(`/${locale}/dashboard/programs`, 'page');
    return { success: true, level };
  } catch (error) {
    console.error('Error updating program level:', error);
    return { success: false, error: 'Failed to update level' };
  }
}

export async function deleteProgramLevelAction(id: string, locale: string = 'en') {
  const ctx = await requireAcademyContext(locale);
  const allowed = await canManageProgramsForRole(ctx.user.role);
  if (!allowed) return { success: false, error: 'Unauthorized' };

  try {
    const existing = await findProgramLevelById(id);
    if (!existing) return { success: false, error: 'Level not found' };
    if (ctx.user.role !== 'admin' && existing.academyId !== ctx.academyId) {
      return { success: false, error: 'Unauthorized' };
    }

    const deleted = await deleteProgramLevel(id);
    if (!deleted) return { success: false, error: 'Level not found' };

    revalidatePath(`/${locale}/dashboard/programs`, 'page');
    return { success: true };
  } catch (error) {
    console.error('Error deleting program level:', error);
    return { success: false, error: 'Failed to delete level' };
  }
}

export async function moveProgramLevelAction(levelId: string, direction: 'up' | 'down', locale: string = 'en') {
  const ctx = await requireAcademyContext(locale);
  const allowed = await canManageProgramsForRole(ctx.user.role);
  if (!allowed) return { success: false, error: 'Unauthorized' };

  try {
    const existing = await findProgramLevelById(levelId);
    if (!existing) return { success: false, error: 'Level not found' };
    if (ctx.user.role !== 'admin' && existing.academyId !== ctx.academyId) {
      return { success: false, error: 'Unauthorized' };
    }

    const levels = await moveProgramLevel(levelId, direction);
    if (!levels) return { success: false, error: 'Level not found' };

    revalidatePath(`/${locale}/dashboard/programs`, 'page');
    return { success: true, levels };
  } catch (error) {
    console.error('Error moving program level:', error);
    return { success: false, error: 'Failed to move level' };
  }
}
