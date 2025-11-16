import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import { findUserById } from '../db/repositories/userRepository';
import { redirect } from 'next/navigation';

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
  isActive: boolean;
}

export interface SessionPayload {
  userId: string;
  email: string;
  username: string;
  [key: string]: unknown;
}

/**
 * Create a JWT token for a user
 */
export async function createSession(user: {
  id: string;
  email: string;
  username: string;
}): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    username: user.username,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify a JWT token and return the payload
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    if (typeof payload.userId === 'string' && 
        typeof payload.email === 'string' && 
        typeof payload.username === 'string') {
      return payload as SessionPayload;
    }
    
    return null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Get the current authenticated user from the cookie
 * Returns null if not authenticated or user is inactive
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
      return null;
    }

    // Verify JWT
    const payload = await verifySession(token.value);
    
    if (!payload || !payload.userId) {
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
      isActive: user.isActive,
    };

  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Require authentication - returns user or redirects to login
 * Use this in server components/actions that require auth
 */
export async function requireAuth(locale: string = 'en'): Promise<AuthUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect(`/${locale}/auth/login`);
  }
  
  return user;
}

/**
 * Get current user or throw error (for API routes)
 */
export async function requireAuthApi(): Promise<AuthUser> {
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
  try {
    const { canUserPerformAction } = await import('../access-control/checkAccess');
    return canUserPerformAction({ userId, resourceKey, action });
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Require permission - returns user if allowed, redirects to forbidden page if not
 */
export async function requirePermission(
  resourceKey: string,
  action: 'read' | 'write' | 'manage' | 'delete' | 'create' = 'read',
  locale: string = 'en'
): Promise<AuthUser> {
  const user = await requireAuth(locale);
  
  const allowed = await hasPermission(user.id, resourceKey, action);
  
  if (!allowed) {
    redirect(`/${locale}/dashboard/forbidden`);
  }
  
  return user;
}

/**
 * Check if current user has permission
 */
export async function checkCurrentUserPermission(
  resourceKey: string,
  action: 'read' | 'write' | 'manage' | 'delete' | 'create' = 'read'
): Promise<boolean> {
  const user = await getCurrentUser();
  
  if (!user) {
    return false;
  }
  
  return hasPermission(user.id, resourceKey, action);
}

/**
 * Clear authentication session
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}
