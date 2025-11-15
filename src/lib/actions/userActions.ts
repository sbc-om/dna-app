'use server';

import { revalidatePath } from 'next/cache';
import {
  createUser,
  updateUser,
  deleteUser,
  type CreateUserInput,
  type UpdateUserInput,
} from '@/lib/db/repositories/userRepository';
import { requirePermission } from '@/lib/auth/auth';

export async function createUserAction(input: CreateUserInput) {
  try {
    // Check permission
    await requirePermission('dashboard.users', 'create');
    
    const user = await createUser(input);
    revalidatePath('/dashboard/users');
    return { success: true, user };
  } catch (error) {
    console.error('Create user error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create user' };
  }
}

export async function updateUserAction(id: string, input: UpdateUserInput) {
  try {
    // Check permission
    await requirePermission('dashboard.users', 'write');
    
    const user = await updateUser(id, input);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    revalidatePath('/dashboard/users');
    return { success: true, user };
  } catch (error) {
    console.error('Update user error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update user' };
  }
}

export async function deleteUserAction(id: string) {
  try {
    // Check permission
    await requirePermission('dashboard.users', 'delete');
    
    const success = await deleteUser(id);
    if (!success) {
      return { success: false, error: 'User not found' };
    }
    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error('Delete user error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete user' };
  }
}
