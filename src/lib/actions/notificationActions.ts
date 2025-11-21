'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/auth';
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/lib/db/repositories/notificationRepository';

export async function getNotificationsAction() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    const notifications = await getUserNotifications(currentUser.id);
    return { success: true, notifications };
  } catch (error) {
    console.error('Get notifications error:', error);
    return { success: false, error: 'Failed to get notifications' };
  }
}

export async function getUnreadCountAction() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, count: 0 };
    }

    const count = await getUnreadNotificationCount(currentUser.id);
    return { success: true, count };
  } catch (error) {
    console.error('Get unread count error:', error);
    return { success: false, count: 0 };
  }
}

export async function markAsReadAction(id: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    await markNotificationAsRead(id);
    revalidatePath('/dashboard/notifications');
    return { success: true };
  } catch (error) {
    console.error('Mark as read error:', error);
    return { success: false, error: 'Failed to mark as read' };
  }
}

export async function markAllAsReadAction() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    await markAllNotificationsAsRead(currentUser.id);
    revalidatePath('/dashboard/notifications');
    return { success: true };
  } catch (error) {
    console.error('Mark all as read error:', error);
    return { success: false, error: 'Failed to mark all as read' };
  }
}

export async function deleteNotificationAction(id: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    await deleteNotification(id, currentUser.id);
    revalidatePath('/dashboard/notifications');
    return { success: true };
  } catch (error) {
    console.error('Delete notification error:', error);
    return { success: false, error: 'Failed to delete notification' };
  }
}
