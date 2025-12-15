'use server';

import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import {
  getAllCourses,
  getActiveCourses,
  getCoursesByAcademyId,
  getActiveCoursesByAcademyId,
  findCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  type CreateCourseInput,
  type Course,
} from '../db/repositories/courseRepository';
import { requireAcademyContext, isAcademyAdmin } from '../academies/academyContext';

// Get all courses (admin only)
export async function getAllCoursesAction() {
  noStore();
  const ctx = await requireAcademyContext('en');
  if (!isAcademyAdmin(ctx)) return { success: false, error: 'Unauthorized' };
  
  try {
    const courses = await getCoursesByAcademyId(ctx.academyId);
    return { success: true, courses };
  } catch (error) {
    console.error('Error getting courses:', error);
    return { success: false, error: 'Failed to get courses' };
  }
}

// Get active courses (accessible to all authenticated users)
export async function getActiveCoursesAction() {
  noStore();
  const ctx = await requireAcademyContext('en');
  
  try {
    const courses = await getActiveCoursesByAcademyId(ctx.academyId);
    return { success: true, courses };
  } catch (error) {
    console.error('Error getting active courses:', error);
    return { success: false, error: 'Failed to get courses' };
  }
}

// Get course by ID
export async function getCourseByIdAction(id: string) {
  noStore();
  const ctx = await requireAcademyContext('en');
  
  try {
    const course = await findCourseById(id);
    
    if (!course) {
      return { success: false, error: 'Course not found' };
    }

    if (ctx.user.role !== 'admin' && course.academyId !== ctx.academyId) {
      return { success: false, error: 'Unauthorized' };
    }
    
    return { success: true, course };
  } catch (error) {
    console.error('Error getting course:', error);
    return { success: false, error: 'Failed to get course' };
  }
}

// Create course (admin only)
export async function createCourseAction(input: CreateCourseInput) {
  const ctx = await requireAcademyContext('en');
  if (!isAcademyAdmin(ctx)) return { success: false, error: 'Unauthorized' };
  
  try {
    const course = await createCourse({ ...input, academyId: ctx.academyId });
    revalidatePath('/[locale]/dashboard/courses', 'page');
    return { success: true, course };
  } catch (error) {
    console.error('Error creating course:', error);
    return { success: false, error: 'Failed to create course' };
  }
}

// Update course (admin only)
export async function updateCourseAction(
  id: string,
  updates: Partial<CreateCourseInput & { isActive: boolean }>
) {
  const ctx = await requireAcademyContext('en');
  if (!isAcademyAdmin(ctx)) return { success: false, error: 'Unauthorized' };
  
  try {
    const existing = await findCourseById(id);
    if (!existing) {
      return { success: false, error: 'Course not found' };
    }
    if (ctx.user.role !== 'admin' && existing.academyId !== ctx.academyId) {
      return { success: false, error: 'Unauthorized' };
    }

    const course = await updateCourse(id, updates);
    
    if (!course) {
      return { success: false, error: 'Course not found' };
    }
    
    revalidatePath('/[locale]/dashboard/courses', 'page');
    revalidatePath(`/[locale]/dashboard/courses/${id}/edit`, 'page');
    return { success: true, course };
  } catch (error) {
    console.error('Error updating course:', error);
    return { success: false, error: 'Failed to update course' };
  }
}

// Delete course (admin only)
export async function deleteCourseAction(id: string) {
  const ctx = await requireAcademyContext('en');
  if (!isAcademyAdmin(ctx)) return { success: false, error: 'Unauthorized' };
  
  try {
    const existing = await findCourseById(id);
    if (!existing) {
      return { success: false, error: 'Course not found' };
    }
    if (ctx.user.role !== 'admin' && existing.academyId !== ctx.academyId) {
      return { success: false, error: 'Unauthorized' };
    }

    const deleted = await deleteCourse(id);
    
    if (!deleted) {
      return { success: false, error: 'Course not found' };
    }
    
    revalidatePath('/[locale]/dashboard/courses', 'page');
    return { success: true };
  } catch (error) {
    console.error('Error deleting course:', error);
    return { success: false, error: 'Failed to delete course' };
  }
}
