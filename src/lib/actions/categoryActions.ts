
'use server';

import { revalidatePath } from 'next/cache';
import {
  getAllCategories,
  createCategory,
  deleteCategory,
  type CreateCategoryInput,
} from '../db/repositories/categoryRepository';
import { getCurrentUser } from '../auth/auth';

// Get all categories
export async function getAllCategoriesAction() {
  try {
    const categories = await getAllCategories();
    return { success: true, categories };
  } catch (error) {
    console.error('Error getting categories:', error);
    return { success: false, error: 'Failed to get categories' };
  }
}

// Create category (admin only)
export async function createCategoryAction(input: CreateCategoryInput) {
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }
  
  try {
    const category = await createCategory(input);
    revalidatePath('/[locale]/dashboard/settings');
    return { success: true, category };
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error: 'Failed to create category' };
  }
}

// Delete category (admin only)
export async function deleteCategoryAction(id: string) {
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }
  
  try {
    const deleted = await deleteCategory(id);
    
    if (!deleted) {
      return { success: false, error: 'Category not found' };
    }
    
    revalidatePath('/[locale]/dashboard/settings');
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: 'Failed to delete category' };
  }
}
