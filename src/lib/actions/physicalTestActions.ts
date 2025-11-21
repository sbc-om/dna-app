'use server';

import {
  createPhysicalTest,
  updatePhysicalTest,
  deletePhysicalTest,
  getPhysicalTestsByUserId,
  getLatestPhysicalTest,
  type CreatePhysicalTestInput,
  type UpdatePhysicalTestInput,
} from '@/lib/db/repositories/physicalTestRepository';
import { requireAuth, requireAdmin } from '@/lib/auth/auth';
import { revalidatePath } from 'next/cache';

export async function createPhysicalTestAction(input: CreatePhysicalTestInput & { locale?: string }) {
  try {
    await requireAdmin(input.locale || 'en');
    
    const test = await createPhysicalTest(input);
    
    revalidatePath(`/${input.locale || 'en'}/dashboard/kids/${input.userId}`);
    
    return { success: true, test };
  } catch (error) {
    console.error('Error creating physical test:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create test' };
  }
}

export async function updatePhysicalTestAction(id: string, input: UpdatePhysicalTestInput & { locale?: string; userId?: string }) {
  try {
    await requireAdmin(input.locale || 'en');
    
    const test = await updatePhysicalTest(id, input);
    
    if (!test) {
      return { success: false, error: 'Test not found' };
    }
    
    revalidatePath(`/${input.locale || 'en'}/dashboard/kids/${input.userId || test.userId}`);
    
    return { success: true, test };
  } catch (error) {
    console.error('Error updating physical test:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update test' };
  }
}

export async function deletePhysicalTestAction(id: string, userId: string, locale: string = 'en') {
  try {
    await requireAdmin(locale);
    
    const success = await deletePhysicalTest(id);
    
    if (!success) {
      return { success: false, error: 'Test not found' };
    }
    
    revalidatePath(`/${locale}/dashboard/kids/${userId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting physical test:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete test' };
  }
}

export async function getPhysicalTestsAction(userId: string) {
  try {
    const tests = await getPhysicalTestsByUserId(userId);
    return { success: true, tests };
  } catch (error) {
    console.error('Error getting physical tests:', error);
    return { success: false, error: 'Failed to get tests' };
  }
}

export async function getLatestPhysicalTestAction(userId: string) {
  try {
    const test = await getLatestPhysicalTest(userId);
    return { success: true, test };
  } catch (error) {
    console.error('Error getting latest physical test:', error);
    return { success: false, error: 'Failed to get latest test' };
  }
}
