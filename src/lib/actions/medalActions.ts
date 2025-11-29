'use server';

import { getCurrentUser } from '../auth/auth';
import * as medalRepo from '../db/repositories/medalRepository';

export async function getMedalsAction() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const medals = await medalRepo.getAllMedals();
    return { success: true, medals };
  } catch (error) {
    console.error('Get medals error:', error);
    return { success: false, error: 'Failed to fetch medals' };
  }
}

export async function getActiveMedalsAction() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const medals = await medalRepo.getActiveMedals();
    return { success: true, medals };
  } catch (error) {
    console.error('Get active medals error:', error);
    return { success: false, error: 'Failed to fetch active medals' };
  }
}

export async function createMedalAction(data: {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  points: number;
  icon: string;
  isActive: boolean;
}) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    const medal = await medalRepo.createMedal(data);
    return { success: true, medal };
  } catch (error) {
    console.error('Create medal error:', error);
    return { success: false, error: 'Failed to create medal' };
  }
}

export async function updateMedalAction(id: string, updates: {
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  points?: number;
  icon?: string;
  isActive?: boolean;
}) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    const medal = await medalRepo.updateMedal(id, updates);
    if (!medal) {
      return { success: false, error: 'Medal not found' };
    }

    return { success: true, medal };
  } catch (error) {
    console.error('Update medal error:', error);
    return { success: false, error: 'Failed to update medal' };
  }
}

export async function deleteMedalAction(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    const deleted = await medalRepo.deleteMedal(id);
    if (!deleted) {
      return { success: false, error: 'Medal not found' };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete medal error:', error);
    return { success: false, error: 'Failed to delete medal' };
  }
}

export async function awardMedalAction(data: {
  studentId: string;
  medalId: string;
  courseId: string;
  attendanceId: string;
  notes?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'coach' && user.role !== 'admin')) {
      return { success: false, error: 'Unauthorized' };
    }

    const studentMedal = await medalRepo.awardMedal({
      ...data,
      awardedBy: user.id,
    });

    return { success: true, studentMedal };
  } catch (error) {
    console.error('Award medal error:', error);
    return { success: false, error: 'Failed to award medal' };
  }
}

export async function getStudentMedalsAction(studentId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const studentMedals = await medalRepo.getStudentMedalsByStudent(studentId);
    
    // Enrich with medal details
    const medalsWithDetails = studentMedals.map((sm) => {
      const medal = medalRepo.getMedalById(sm.medalId);
      return { ...sm, medal: medal || undefined };
    });
    
    return { success: true, studentMedals: medalsWithDetails };
  } catch (error) {
    console.error('Get student medals error:', error);
    return { success: false, error: 'Failed to fetch student medals' };
  }
}

export async function getStudentCourseMedalsAction(studentId: string, courseId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const studentMedals = await medalRepo.getStudentMedalsByCourse(studentId, courseId);
    
    // Enrich with medal details
    const medalsWithDetails = studentMedals.map((sm) => {
      const medal = medalRepo.getMedalById(sm.medalId);
      return { ...sm, medal: medal || undefined };
    });
    
    return { success: true, studentMedals: medalsWithDetails };
  } catch (error) {
    console.error('Get student course medals error:', error);
    return { success: false, error: 'Failed to fetch student course medals' };
  }
}

export async function removeMedalFromStudentAction(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'coach' && user.role !== 'admin')) {
      return { success: false, error: 'Unauthorized' };
    }

    const removed = await medalRepo.removeMedalFromStudent(id);
    if (!removed) {
      return { success: false, error: 'Medal award not found' };
    }

    return { success: true };
  } catch (error) {
    console.error('Remove medal from student error:', error);
    return { success: false, error: 'Failed to remove medal from student' };
  }
}
