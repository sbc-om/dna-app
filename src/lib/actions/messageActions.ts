'use server';

import { revalidatePath } from 'next/cache';
import {
  createMessage,
  createGroup,
  getConversation,
  getUserConversations,
  getGroupMessages,
  markMessageAsRead,
  getUnreadCount,
  getAllGroups,
  getUserGroups,
  updateGroup,
  deleteGroup,
  getGroupById,
  type CreateGroupInput,
} from '@/lib/db/repositories/messageRepository';
import { getCurrentUser, requireAdmin } from '@/lib/auth/auth';
import { findUserById } from '@/lib/db/repositories/userRepository';
import { getAcademyContextIfAuthenticated } from '@/lib/academies/academyContext';
import { listAcademyMembers } from '@/lib/db/repositories/academyMembershipRepository';

async function isManagerAllowedRecipient(managerUserId: string, recipientUserId: string): Promise<boolean> {
  const ctx = await getAcademyContextIfAuthenticated();
  if (!ctx) return false;
  if (ctx.user.id !== managerUserId) return false;
  if (ctx.academyRole !== 'manager') return false;

  const members = await listAcademyMembers(ctx.academyId);
  return members.some((m) => m.userId === recipientUserId);
}

async function isManagerAllowedGroup(managerUserId: string, groupId: string): Promise<boolean> {
  const ctx = await getAcademyContextIfAuthenticated();
  if (!ctx) return false;
  if (ctx.user.id !== managerUserId) return false;
  if (ctx.academyRole !== 'manager') return false;

  const group = await getGroupById(groupId);
  if (!group) return false;

  const members = await listAcademyMembers(ctx.academyId);
  const allowed = new Set(members.map((m) => m.userId));
  allowed.add(managerUserId);

  return group.members.every((id) => allowed.has(id));
}

/**
 * Send push notification to user
 */
async function sendPushNotification(userId: string, title: string, message: string, url?: string) {
  try {
    const { sendNotification } = await import('@/lib/notifications/sendNotification');
    
    await sendNotification(userId, {
      title,
      body: message,
      url,
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

export async function sendMessageAction(input: {
  recipientId?: string;
  groupId?: string;
  content: string;
  locale?: string;
}) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    if (!input.content.trim()) {
      return { success: false, error: 'Message content cannot be empty' };
    }

    if (!input.recipientId && !input.groupId) {
      return { success: false, error: 'Recipient or group is required' };
    }

    if (currentUser.role === 'manager') {
      if (input.recipientId) {
        const allowed = await isManagerAllowedRecipient(currentUser.id, input.recipientId);
        if (!allowed) {
          return { success: false, error: 'Not authorized to message this recipient' };
        }
      }

      if (input.groupId) {
        const allowedGroup = await isManagerAllowedGroup(currentUser.id, input.groupId);
        if (!allowedGroup) {
          return { success: false, error: 'Not authorized to message this group' };
        }
      }
    }

    const message = await createMessage({
      senderId: currentUser.id,
      recipientId: input.recipientId,
      groupId: input.groupId,
      content: input.content,
    });

    // Send push notification to recipient(s)
    if (input.recipientId) {
      // Individual message - send to recipient
      const recipient = await findUserById(input.recipientId);
      const locale = input.locale || 'en';
      if (recipient) {
        await sendPushNotification(
          input.recipientId,
          `New message from ${currentUser.fullName || currentUser.username}`,
          input.content.length > 50 ? input.content.substring(0, 50) + '...' : input.content,
          `/${locale}/dashboard/messages`
        );
      }
    } else if (input.groupId) {
      // Group message - send to all group members except sender
      // This will be implemented when we add group member tracking
      // For now, we'll skip group notifications
    }

    revalidatePath('/dashboard/messages');
    
    return { success: true, message };
  } catch (error) {
    console.error('Send message error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send message' };
  }
}

export async function getConversationAction(otherUserId: string) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    const messages = await getConversation(currentUser.id, otherUserId);
    const otherUser = await findUserById(otherUserId);

    if (!otherUser) {
      return { success: false, error: 'User not found' };
    }

    return { success: true, messages, otherUser };
  } catch (error) {
    console.error('Get conversation error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get conversation' };
  }
}

export async function getUserConversationsAction() {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    const conversations = await getUserConversations(currentUser.id);
    
    // Fetch user details for each conversation
    const conversationsWithUsers = await Promise.all(
      conversations.map(async (conv) => {
        const user = await findUserById(conv.userId);
        return { ...conv, user };
      })
    );

    // If the other user was deleted, do not expose the conversation.
    const filtered = conversationsWithUsers.filter((c) => Boolean(c.user));

    return { success: true, conversations: filtered };
  } catch (error) {
    console.error('Get conversations error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get conversations' };
  }
}

export async function getGroupMessagesAction(groupId: string) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    const messages = await getGroupMessages(groupId);
    
    return { success: true, messages };
  } catch (error) {
    console.error('Get group messages error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get group messages' };
  }
}

export async function markMessageAsReadAction(messageId: string) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    const success = await markMessageAsRead(messageId, currentUser.id);
    
    if (!success) {
      return { success: false, error: 'Message not found' };
    }

    revalidatePath('/dashboard/messages');
    
    return { success: true };
  } catch (error) {
    console.error('Mark message as read error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to mark message as read' };
  }
}

export async function getUnreadCountAction() {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return { success: false, error: 'Not authenticated', count: 0 };
    }

    const count = await getUnreadCount(currentUser.id);
    
    return { success: true, count };
  } catch (error) {
    console.error('Get unread count error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get unread count', count: 0 };
  }
}

export async function createGroupAction(input: CreateGroupInput) {
  try {
    // Only admin can create groups
    await requireAdmin();

    if (!input.name.trim()) {
      return { success: false, error: 'Group name is required' };
    }

    if (!input.members || input.members.length === 0) {
      return { success: false, error: 'At least one member is required' };
    }

    const group = await createGroup(input);

    revalidatePath('/dashboard/messages');
    
    return { success: true, group };
  } catch (error) {
    console.error('Create group error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create group' };
  }
}

export async function getAllGroupsAction() {
  try {
    // Only admin can see all groups
    await requireAdmin();

    const groups = await getAllGroups();
    
    return { success: true, groups };
  } catch (error) {
    console.error('Get all groups error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get groups' };
  }
}

export async function getUserGroupsAction() {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    const groups = await getUserGroups(currentUser.id);
    
    return { success: true, groups };
  } catch (error) {
    console.error('Get user groups error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get groups' };
  }
}

export async function updateGroupAction(id: string, updates: { name?: string; members?: string[] }) {
  try {
    // Only admin can update groups
    await requireAdmin();

    const group = await updateGroup(id, updates);

    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    revalidatePath('/dashboard/messages');
    
    return { success: true, group };
  } catch (error) {
    console.error('Update group error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update group' };
  }
}

export async function deleteGroupAction(id: string) {
  try {
    // Only admin can delete groups
    await requireAdmin();

    const success = await deleteGroup(id);

    if (!success) {
      return { success: false, error: 'Group not found' };
    }

    revalidatePath('/dashboard/messages');
    
    return { success: true };
  } catch (error) {
    console.error('Delete group error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete group' };
  }
}
