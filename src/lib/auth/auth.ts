import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import { findUserById } from '../db/repositories/userRepository';
import { redirect } from 'next/navigation';
import { UserRole } from '@/config/roles';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-in-production'
);

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  phoneNumber?: string;
  profilePicture?: string;
  role: UserRole;
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
      profilePicture: user.profilePicture,
      role: user.role,
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
 * Require admin role - redirects to forbidden if not admin
 */
export async function requireAdmin(locale: string = 'en'): Promise<AuthUser> {
  const user = await requireAuth(locale);
  
  if (user.role !== 'admin') {
    redirect(`/${locale}/dashboard/forbidden`);
  }
  
  return user;
}

/**
 * Require specific role
 */
export async function requireRole(role: UserRole | UserRole[], locale: string = 'en'): Promise<AuthUser> {
  const user = await requireAuth(locale);
  
  const allowedRoles = Array.isArray(role) ? role : [role];
  
  if (!allowedRoles.includes(user.role)) {
    redirect(`/${locale}/dashboard/forbidden`);
  }
  
  return user;
}

/**
 * Clear authentication session
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}
