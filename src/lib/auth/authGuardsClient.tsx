'use client';

import { ReactNode } from 'react';
import { useAuth } from './authContext';

/**
 * Client component that only shows children if user is authenticated
 */
export function ShowIfAuthenticated({ 
  children,
  fallback 
}: { 
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

/**
 * Client component that only shows children if user is NOT authenticated
 */
export function ShowIfNotAuthenticated({ 
  children 
}: { 
  children: ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return null;
}

/**
 * Hook to check if user is authenticated (for client components)
 */
export function useIsAuthenticated() {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
}
