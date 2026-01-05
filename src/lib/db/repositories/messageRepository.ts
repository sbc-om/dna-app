import { getDatabase, generateId } from '../lmdb';

export interface Message {
  id: string;
  senderId: string;
  recipientId?: string; // For individual messages
  groupId?: string; // For group messages
  content: string;
  createdAt: string;
  readBy: string[]; // Array of user IDs who have read the message
  isDeleted: boolean;
}

export interface MessageGroup {
  id: string;
  name: string;
  createdBy: string;
  members: string[]; // Array of user IDs
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessageInput {
  senderId: string;
  recipientId?: string;
  groupId?: string;
  content: string;
}

export interface CreateGroupInput {
  name: string;
  createdBy: string;
  members: string[];
}

const MESSAGES_PREFIX = 'messages:';
const GROUPS_PREFIX = 'message_groups:';
const USER_MESSAGES_PREFIX = 'user_messages:'; // Index for user's messages
const GROUP_MESSAGES_PREFIX = 'group_messages:'; // Index for group's messages

/**
 * Create a new message
 */
export async function createMessage(input: CreateMessageInput): Promise<Message> {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  const message: Message = {
    id,
    senderId: input.senderId,
    recipientId: input.recipientId,
    groupId: input.groupId,
    content: input.content,
    createdAt: now,
    readBy: [input.senderId], // Sender has already read their own message
    isDeleted: false,
  };

  // Store message
  await db.put(`${MESSAGES_PREFIX}${id}`, message);

  // Create indexes for quick retrieval
  if (input.recipientId) {
    // Index for recipient
    await db.put(`${USER_MESSAGES_PREFIX}${input.recipientId}:${now}:${id}`, id);
    // Index for sender
    await db.put(`${USER_MESSAGES_PREFIX}${input.senderId}:${now}:${id}`, id);
  }

  if (input.groupId) {
    // Index for group
    await db.put(`${GROUP_MESSAGES_PREFIX}${input.groupId}:${now}:${id}`, id);
  }

  return message;
}

/**
 * Get message by ID
 */
export async function getMessageById(id: string): Promise<Message | null> {
  const db = getDatabase();
  const message = await db.get(`${MESSAGES_PREFIX}${id}`);
  return message || null;
}

/**
 * Get messages between two users
 */
export async function getConversation(user1Id: string, user2Id: string): Promise<Message[]> {
  const db = getDatabase();
  const messages: Message[] = [];

  // Get all messages
  for await (const { value } of db.getRange({ 
    start: MESSAGES_PREFIX, 
    end: MESSAGES_PREFIX + '\uffff' 
  })) {
    if (value && !value.isDeleted && !value.groupId) {
      // Check if message is between these two users
      if ((value.senderId === user1Id && value.recipientId === user2Id) ||
          (value.senderId === user2Id && value.recipientId === user1Id)) {
        messages.push(value);
      }
    }
  }

  // Sort by createdAt
  return messages.sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/**
 * Get user's conversations (list of users they've chatted with)
 */
export async function getUserConversations(userId: string): Promise<{ userId: string; lastMessage: Message }[]> {
  const db = getDatabase();
  const conversationsMap = new Map<string, Message>();

  // Get all messages involving this user
  for await (const { value } of db.getRange({ 
    start: MESSAGES_PREFIX, 
    end: MESSAGES_PREFIX + '\uffff' 
  })) {
    if (value && !value.isDeleted && !value.groupId) {
      if (value.senderId === userId || value.recipientId === userId) {
        const otherUserId = value.senderId === userId ? value.recipientId : value.senderId;
        const existing = conversationsMap.get(otherUserId!);
        
        if (!existing || new Date(value.createdAt) > new Date(existing.createdAt)) {
          conversationsMap.set(otherUserId!, value);
        }
      }
    }
  }

  return Array.from(conversationsMap.entries()).map(([userId, lastMessage]) => ({
    userId,
    lastMessage,
  })).sort((a, b) => 
    new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
  );
}

/**
 * Get group messages
 */
export async function getGroupMessages(groupId: string): Promise<Message[]> {
  const db = getDatabase();
  const messages: Message[] = [];

  for await (const { value } of db.getRange({ 
    start: MESSAGES_PREFIX, 
    end: MESSAGES_PREFIX + '\uffff' 
  })) {
    if (value && !value.isDeleted && value.groupId === groupId) {
      messages.push(value);
    }
  }

  return messages.sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId: string, userId: string): Promise<boolean> {
  const db = getDatabase();
  const message = await getMessageById(messageId);

  if (!message) {
    return false;
  }

  if (!message.readBy.includes(userId)) {
    message.readBy.push(userId);
    await db.put(`${MESSAGES_PREFIX}${messageId}`, message);
  }

  return true;
}

/**
 * Get unread message count for user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const db = getDatabase();
  let count = 0;

  for await (const { value } of db.getRange({ 
    start: MESSAGES_PREFIX, 
    end: MESSAGES_PREFIX + '\uffff' 
  })) {
    if (value && !value.isDeleted) {
      // Count if user is recipient and hasn't read
      if ((value.recipientId === userId || 
           (value.groupId && await isUserInGroup(userId, value.groupId))) &&
          !value.readBy.includes(userId)) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Create a message group
 */
export async function createGroup(input: CreateGroupInput): Promise<MessageGroup> {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  const group: MessageGroup = {
    id,
    name: input.name,
    createdBy: input.createdBy,
    members: input.members,
    createdAt: now,
    updatedAt: now,
  };

  await db.put(`${GROUPS_PREFIX}${id}`, group);
  return group;
}

/**
 * Get group by ID
 */
export async function getGroupById(id: string): Promise<MessageGroup | null> {
  const db = getDatabase();
  const group = await db.get(`${GROUPS_PREFIX}${id}`);
  return group || null;
}

/**
 * Get all groups
 */
export async function getAllGroups(): Promise<MessageGroup[]> {
  const db = getDatabase();
  const groups: MessageGroup[] = [];

  for await (const { value } of db.getRange({ 
    start: GROUPS_PREFIX, 
    end: GROUPS_PREFIX + '\uffff' 
  })) {
    if (value) {
      groups.push(value);
    }
  }

  return groups.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

/**
 * Get groups for a user
 */
export async function getUserGroups(userId: string): Promise<MessageGroup[]> {
  const groups = await getAllGroups();
  return groups.filter(group => group.members.includes(userId));
}

/**
 * Update group
 */
export async function updateGroup(id: string, updates: Partial<Omit<MessageGroup, 'id' | 'createdAt' | 'createdBy'>>): Promise<MessageGroup | null> {
  const db = getDatabase();
  const group = await getGroupById(id);

  if (!group) {
    return null;
  }

  const updatedGroup: MessageGroup = {
    ...group,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await db.put(`${GROUPS_PREFIX}${id}`, updatedGroup);
  return updatedGroup;
}

/**
 * Delete group
 */
export async function deleteGroup(id: string): Promise<boolean> {
  const db = getDatabase();
  const group = await getGroupById(id);

  if (!group) {
    return false;
  }

  await db.remove(`${GROUPS_PREFIX}${id}`);
  return true;
}

/**
 * Check if user is in group
 */
export async function isUserInGroup(userId: string, groupId: string): Promise<boolean> {
  const group = await getGroupById(groupId);
  return group ? group.members.includes(userId) : false;
}

/**
 * Delete message
 */
export async function deleteMessage(id: string): Promise<boolean> {
  const db = getDatabase();
  const message = await getMessageById(id);

  if (!message) {
    return false;
  }

  message.isDeleted = true;
  await db.put(`${MESSAGES_PREFIX}${id}`, message);
  return true;
}

/**
 * Soft-delete all messages related to a user.
 *
 * This is used when a user account is deleted to ensure that:
 * - No direct messages involving that user are shown anymore.
 * - No group messages authored by that user are shown anymore.
 *
 * We intentionally use a soft-delete (`isDeleted`) to keep historical records
 * while preventing any UI/API from displaying them.
 */
export async function softDeleteMessagesForUser(userId: string): Promise<number> {
  const db = getDatabase();
  let deletedCount = 0;

  for await (const { key, value } of db.getRange({
    start: MESSAGES_PREFIX,
    end: MESSAGES_PREFIX + '\uffff',
  })) {
    if (!value) continue;
    const message = value as Message;

    if (message.isDeleted) continue;

    const isRelated = message.senderId === userId || message.recipientId === userId;
    if (!isRelated) continue;

    const updated: Message = { ...message, isDeleted: true };
    await db.put(String(key), updated);
    deletedCount += 1;
  }

  return deletedCount;
}
