import { getDatabase, generateId } from '../lmdb';

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'all' | 'system' | 'appointments' | 'users' | 'messages';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

const NOTIFICATION_PREFIX = 'notification:';
const USER_NOTIFICATIONS_PREFIX = 'user_notifications:';

/**
 * Create a new notification
 */
export async function createNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Promise<Notification> {
  const db = getDatabase();
  const id = generateId();
  const timestamp = new Date().toISOString();
  
  const newNotification: Notification = {
    ...notification,
    id,
    timestamp,
    read: false,
  };

  // Store notification
  await db.put(`${NOTIFICATION_PREFIX}${id}`, newNotification);
  
  // Add to user's notification list
  const userKey = `${USER_NOTIFICATIONS_PREFIX}${notification.userId}`;
  const userNotifications = (await db.get(userKey)) || [];
  userNotifications.unshift(id); // Add to beginning
  await db.put(userKey, userNotifications);

  return newNotification;
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
  const db = getDatabase();
  const userKey = `${USER_NOTIFICATIONS_PREFIX}${userId}`;
  const notificationIds = (await db.get(userKey)) || [];
  
  const notifications: Notification[] = [];
  
  for (const id of notificationIds.slice(0, limit)) {
    const notification = await db.get(`${NOTIFICATION_PREFIX}${id}`);
    if (notification) {
      notifications.push(notification);
    }
  }
  
  return notifications;
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const notifications = await getUserNotifications(userId);
  return notifications.filter(n => !n.read).length;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(id: string): Promise<boolean> {
  const db = getDatabase();
  const notification = await db.get(`${NOTIFICATION_PREFIX}${id}`);
  
  if (!notification) return false;
  
  notification.read = true;
  await db.put(`${NOTIFICATION_PREFIX}${id}`, notification);
  
  return true;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const notifications = await getUserNotifications(userId);
  const db = getDatabase();
  
  for (const notification of notifications) {
    if (!notification.read) {
      notification.read = true;
      await db.put(`${NOTIFICATION_PREFIX}${notification.id}`, notification);
    }
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: string, userId: string): Promise<boolean> {
  const db = getDatabase();
  
  // Remove from main storage
  await db.remove(`${NOTIFICATION_PREFIX}${id}`);
  
  // Remove from user's list
  const userKey = `${USER_NOTIFICATIONS_PREFIX}${userId}`;
  const userNotifications = (await db.get(userKey)) || [];
  const updatedList = userNotifications.filter((nId: string) => nId !== id);
  await db.put(userKey, updatedList);
  
  return true;
}
