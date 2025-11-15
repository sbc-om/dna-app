import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { findUserById } from '../db/repositories/userRepository';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-in-production'
);

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  phoneNumber?: string;
  groupIds: string[];
  directPermissions: string[];
}

/**
 * Get the current authenticated user from the cookie
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
      return null;
    }

    // Verify JWT
    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    
    if (!payload.userId || typeof payload.userId !== 'string') {
      return null;
    }

    // Get user from database
    const user = await findUserById(payload.userId);
    
    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      groupIds: user.groupIds,
      directPermissions: user.directPermissions,
    };

  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

/**
 * Check if user has permission to access a resource
 */
export async function hasPermission(
  userId: string,
  resourceKey: string,
  action: 'read' | 'write' | 'manage' | 'delete' | 'create' = 'read'
): Promise<boolean> {
  const { canUserPerformAction } = await import('../access-control/checkAccess');
  return canUserPerformAction({ userId, resourceKey, action });
}

/**
 * Require permission - throw error if user doesn't have permission
 */
export async function requirePermission(
  resourceKey: string,
  action: 'read' | 'write' | 'manage' | 'delete' | 'create' = 'read'
): Promise<AuthUser> {
  const user = await requireAuth();
  
  const allowed = await hasPermission(user.id, resourceKey, action);
  
  if (!allowed) {
    throw new Error('Forbidden: You do not have permission to access this resource');
  }
  
  return user;
}
