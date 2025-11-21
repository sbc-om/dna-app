import { getDatabase, generateId } from '../lmdb';

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

const PUSH_SUBSCRIPTIONS_PREFIX = 'push_subscription:';
const USER_SUBSCRIPTIONS_PREFIX = 'user_subscriptions:';

/**
 * Save push subscription for a user
 */
export async function savePushSubscription(
  userId: string,
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  },
  userAgent?: string
): Promise<PushSubscription> {
  const db = await getDatabase();

  // Check if subscription already exists
  const existingId = await findSubscriptionIdByEndpoint(subscription.endpoint);
  
  if (existingId) {
    // Update existing subscription
    const existing = await db.get(`${PUSH_SUBSCRIPTIONS_PREFIX}${existingId}`) as PushSubscription;
    const updated: PushSubscription = {
      ...existing,
      userId,
      keys: subscription.keys,
      userAgent,
      updatedAt: new Date().toISOString(),
    };
    await db.put(`${PUSH_SUBSCRIPTIONS_PREFIX}${existingId}`, updated);

    // Update user index
    const userSubscriptions = await getUserSubscriptionIds(userId);
    if (!userSubscriptions.includes(existingId)) {
      userSubscriptions.push(existingId);
      await db.put(`${USER_SUBSCRIPTIONS_PREFIX}${userId}`, userSubscriptions);
    }

    return updated;
  }

  // Create new subscription
  const id = generateId();
  const now = new Date().toISOString();

  const pushSubscription: PushSubscription = {
    id,
    userId,
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    userAgent,
    createdAt: now,
    updatedAt: now,
  };

  await db.put(`${PUSH_SUBSCRIPTIONS_PREFIX}${id}`, pushSubscription);

  // Update user index
  const userSubscriptions = await getUserSubscriptionIds(userId);
  userSubscriptions.push(id);
  await db.put(`${USER_SUBSCRIPTIONS_PREFIX}${userId}`, userSubscriptions);

  return pushSubscription;
}

/**
 * Get all subscriptions for a user
 */
export async function getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
  const db = await getDatabase();
  const subscriptionIds = await getUserSubscriptionIds(userId);

  const subscriptions: PushSubscription[] = [];
  for (const id of subscriptionIds) {
    const subscription = await db.get(`${PUSH_SUBSCRIPTIONS_PREFIX}${id}`) as PushSubscription;
    if (subscription) {
      subscriptions.push(subscription);
    }
  }

  return subscriptions;
}

/**
 * Get subscription IDs for a user
 */
async function getUserSubscriptionIds(userId: string): Promise<string[]> {
  const db = await getDatabase();
  const ids = await db.get(`${USER_SUBSCRIPTIONS_PREFIX}${userId}`) as string[];
  return ids || [];
}

/**
 * Find subscription ID by endpoint
 */
async function findSubscriptionIdByEndpoint(endpoint: string): Promise<string | null> {
  const db = await getDatabase();
  const range = db.getRange({
    start: PUSH_SUBSCRIPTIONS_PREFIX,
    end: `${PUSH_SUBSCRIPTIONS_PREFIX}\xff`,
  });

  for await (const { value } of range) {
    const subscription = value as PushSubscription;
    if (subscription.endpoint === endpoint) {
      return subscription.id;
    }
  }

  return null;
}

/**
 * Delete a subscription
 */
export async function deletePushSubscription(subscriptionId: string): Promise<boolean> {
  const db = await getDatabase();
  const subscription = await db.get(`${PUSH_SUBSCRIPTIONS_PREFIX}${subscriptionId}`) as PushSubscription;

  if (!subscription) {
    return false;
  }

  // Remove from database
  await db.remove(`${PUSH_SUBSCRIPTIONS_PREFIX}${subscriptionId}`);

  // Remove from user index
  const userSubscriptions = await getUserSubscriptionIds(subscription.userId);
  const updatedSubscriptions = userSubscriptions.filter(id => id !== subscriptionId);
  await db.put(`${USER_SUBSCRIPTIONS_PREFIX}${subscription.userId}`, updatedSubscriptions);

  return true;
}

/**
 * Delete all subscriptions for a user
 */
export async function deleteUserSubscriptions(userId: string): Promise<number> {
  const subscriptions = await getUserSubscriptions(userId);
  
  let deletedCount = 0;
  for (const subscription of subscriptions) {
    const success = await deletePushSubscription(subscription.id);
    if (success) {
      deletedCount++;
    }
  }

  return deletedCount;
}

/**
 * Get subscription by endpoint
 */
export async function getSubscriptionByEndpoint(endpoint: string): Promise<PushSubscription | null> {
  const id = await findSubscriptionIdByEndpoint(endpoint);
  if (!id) {
    return null;
  }

  const db = await getDatabase();
  return await db.get(`${PUSH_SUBSCRIPTIONS_PREFIX}${id}`) as PushSubscription;
}
