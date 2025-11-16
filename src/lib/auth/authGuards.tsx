import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { requireAuth, requirePermission, checkCurrentUserPermission } from '@/lib/auth/auth';
import { Locale } from '@/config/i18n';

/**
 * Server component wrapper that requires authentication
 * Use this to wrap page content that requires a logged-in user
 */
export async function RequireAuth({
  children,
  locale = 'en',
}: {
  children: ReactNode;
  locale?: Locale;
}) {
  await requireAuth(locale);
  return <>{children}</>;
}

/**
 * Server component wrapper that requires specific permission
 * Use this to wrap page content that requires specific access rights
 */
export async function RequirePermission({
  children,
  resourceKey,
  action = 'read',
  locale = 'en',
  fallback,
}: {
  children: ReactNode;
  resourceKey: string;
  action?: 'read' | 'write' | 'manage' | 'delete' | 'create';
  locale?: Locale;
  fallback?: ReactNode;
}) {
  try {
    await requirePermission(resourceKey, action, locale);
    return <>{children}</>;
  } catch (error) {
    if (fallback) {
      return <>{fallback}</>;
    }
    // Will redirect to forbidden page
    throw error;
  }
}

/**
 * Server component that conditionally shows children based on permission
 * Use this when you want to hide/show UI elements based on permissions
 */
export async function ShowIfHasPermission({
  children,
  resourceKey,
  action = 'read',
  fallback,
}: {
  children: ReactNode;
  resourceKey: string;
  action?: 'read' | 'write' | 'manage' | 'delete' | 'create';
  fallback?: ReactNode;
}) {
  const hasPermission = await checkCurrentUserPermission(resourceKey, action);

  if (hasPermission) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

/**
 * Server component that shows children only if user does NOT have permission
 * Useful for showing "request access" messages
 */
export async function ShowIfNoPermission({
  children,
  resourceKey,
  action = 'read',
}: {
  children: ReactNode;
  resourceKey: string;
  action?: 'read' | 'write' | 'manage' | 'delete' | 'create';
}) {
  const hasPermission = await checkCurrentUserPermission(resourceKey, action);

  if (!hasPermission) {
    return <>{children}</>;
  }

  return null;
}

/**
 * Get current user in server component with fallback
 */
export async function withUser<T>(
  callback: (user: NonNullable<Awaited<ReturnType<typeof requireAuth>>>) => T,
  locale: Locale = 'en'
): Promise<T> {
  const user = await requireAuth(locale);
  return callback(user);
}
