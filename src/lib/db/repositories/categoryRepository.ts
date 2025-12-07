
import { getDatabase, generateId } from '../lmdb';

export interface Category {
  id: string;
  name: string;
  nameAr: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  nameAr: string;
}

// Get all categories
export async function getAllCategories(): Promise<Category[]> {
  const db = getDatabase();
  const categories: Category[] = [];
  
  const range = db.getRange({ start: 'category:', end: 'category:\xFF' });
  
  for (const { key, value } of range) {
    const keyStr = String(key);
    if (keyStr.startsWith('category:') && value) {
      categories.push(value as Category);
    }
  }
  
  return categories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Create new category
export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const db = getDatabase();
  const id = generateId();
  
  const category: Category = {
    id,
    name: input.name,
    nameAr: input.nameAr,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  db.put(`category:${id}`, category);
  
  return category;
}

// Delete category
export async function deleteCategory(id: string): Promise<boolean> {
  const db = getDatabase();
  const category = db.get(`category:${id}`);
  
  if (!category) {
    return false;
  }
  
  db.remove(`category:${id}`);
  return true;
}
