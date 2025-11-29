'use server';

import { getCurrentUser } from '../auth/auth';
import * as sessionPlanRepo from '../db/repositories/sessionPlanRepository';
import type { CreateSessionPlanInput, SessionActivity } from '../db/repositories/sessionPlanRepository';

export async function getSessionPlansAction(courseId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const plans = sessionPlanRepo.getSessionPlansByCourseId(courseId);
    return { success: true, plans };
  } catch (error) {
    console.error('Get session plans error:', error);
    return { success: false, error: 'Failed to fetch session plans' };
  }
}

export async function getSessionPlanByIdAction(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const plan = sessionPlanRepo.getSessionPlanById(id);
    if (!plan) {
      return { success: false, error: 'Session plan not found' };
    }

    return { success: true, plan };
  } catch (error) {
    console.error('Get session plan error:', error);
    return { success: false, error: 'Failed to fetch session plan' };
  }
}

export async function getSessionPlanByDateAction(courseId: string, date: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const plan = sessionPlanRepo.getSessionPlanByDate(courseId, date);
    return { success: true, plan };
  } catch (error) {
    console.error('Get session plan by date error:', error);
    return { success: false, error: 'Failed to fetch session plan' };
  }
}

export async function createSessionPlanAction(input: CreateSessionPlanInput) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'coach')) {
      return { success: false, error: 'Unauthorized' };
    }

    const plan = sessionPlanRepo.createSessionPlan(input);
    return { success: true, plan };
  } catch (error) {
    console.error('Create session plan error:', error);
    return { success: false, error: 'Failed to create session plan' };
  }
}

export async function updateSessionPlanAction(id: string, updates: Partial<CreateSessionPlanInput & { status: 'planned' | 'in-progress' | 'completed' | 'cancelled' }>) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'coach')) {
      return { success: false, error: 'Unauthorized' };
    }

    // Convert activities if present (add IDs)
    const updatesWithIds: any = { ...updates };
    if (updates.activities) {
      updatesWithIds.activities = updates.activities.map((activity: any) => ({
        ...activity,
        id: activity.id || `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }));
    }

    const plan = sessionPlanRepo.updateSessionPlan(id, updatesWithIds);
    if (!plan) {
      return { success: false, error: 'Session plan not found' };
    }

    return { success: true, plan };
  } catch (error) {
    console.error('Update session plan error:', error);
    return { success: false, error: 'Failed to update session plan' };
  }
}

export async function deleteSessionPlanAction(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    const deleted = sessionPlanRepo.deleteSessionPlan(id);
    if (!deleted) {
      return { success: false, error: 'Session plan not found' };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete session plan error:', error);
    return { success: false, error: 'Failed to delete session plan' };
  }
}

export async function getCourseCalendarAction(courseId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const calendar = sessionPlanRepo.getCourseCalendar(courseId);
    return { success: true, calendar };
  } catch (error) {
    console.error('Get course calendar error:', error);
    return { success: false, error: 'Failed to fetch course calendar' };
  }
}

export async function bulkCreateSessionPlansAction(plans: CreateSessionPlanInput[]) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    const created = sessionPlanRepo.bulkCreateSessionPlans(plans);
    return { success: true, plans: created };
  } catch (error) {
    console.error('Bulk create session plans error:', error);
    return { success: false, error: 'Failed to create session plans' };
  }
}
