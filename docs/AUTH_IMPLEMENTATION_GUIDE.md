# Authentication System - Implementation Guide

## Overview

This guide explains how to use the refactored authentication system in the DNA Web App.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Server Components](#server-components)
4. [Client Components](#client-components)
5. [API Routes](#api-routes)
6. [Permission System](#permission-system)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

## Quick Start

### Protecting a Page

Pages under `/dashboard` are automatically protected by middleware. No extra code needed!

```tsx
// src/app/[locale]/dashboard/my-page/page.tsx
export default async function MyPage() {
  // User is authenticated via middleware
  return <div>Protected content</div>;
}
```

### Getting Current User

```tsx
import { requireAuth } from '@/lib/auth/auth';

export default async function MyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await requireAuth(locale);
  
  return <div>Hello {user.fullName}</div>;
}
```

### Checking Permissions

```tsx
import { checkCurrentUserPermission } from '@/lib/auth/auth';

export default async function MyPage() {
  const canEdit = await checkCurrentUserPermission('users', 'write');
  
  return <div>{canEdit && <EditButton />}</div>;
}
```

## Architecture

### Flow Diagram

```
Request → Middleware → Token Validation → Allow/Redirect
                            ↓
                     Dashboard Layout
                            ↓
                        Page Component
```

### Key Components

1. **Middleware** (`src/middleware.ts`)
   - Protects routes at the edge
   - Validates JWT tokens
   - Handles redirects

2. **Auth Helpers** (`src/lib/auth/auth.ts`)
   - Server-side authentication utilities
   - Session management
   - Permission checking

3. **Auth Context** (`src/lib/auth/authContext.tsx`)
   - Client-side auth state
   - Login/logout functions
   - React hooks

4. **Auth Guards** (`src/lib/auth/authGuards.tsx`, `authGuardsClient.tsx`)
   - Reusable wrapper components
   - Conditional rendering
   - Permission-based UI

## Server Components

### Available Functions

#### `getCurrentUser()`
Returns current user or null. Use when auth is optional.

```tsx
const user = await getCurrentUser();
if (user) {
  // Show user-specific content
}
```

#### `requireAuth(locale)`
Returns user or redirects to login. Use for protected pages.

```tsx
const user = await requireAuth('en');
// User is guaranteed to exist here
```

#### `checkCurrentUserPermission(resourceKey, action)`
Returns boolean indicating if current user has permission.

```tsx
const canDelete = await checkCurrentUserPermission('users', 'delete');
```

#### `requirePermission(resourceKey, action, locale)`
Requires permission or redirects to forbidden page.

```tsx
await requirePermission('admin.panel', 'read', locale);
// Only executes if user has permission
```

### Auth Guard Components

#### `<RequireAuth>`
Wraps content that requires authentication.

```tsx
<RequireAuth locale="en">
  <ProtectedContent />
</RequireAuth>
```

#### `<RequirePermission>`
Wraps content that requires specific permission.

```tsx
<RequirePermission resourceKey="users.delete" action="delete" locale="en">
  <DeleteButton />
</RequirePermission>
```

#### `<ShowIfHasPermission>`
Conditionally shows content based on permission.

```tsx
<ShowIfHasPermission 
  resourceKey="reports" 
  action="read"
  fallback={<p>Access denied</p>}
>
  <Reports />
</ShowIfHasPermission>
```

## Client Components

### Using Auth Context

First, wrap your app or specific routes with `AuthProvider`:

```tsx
'use client';

import { AuthProvider } from '@/lib/auth/authContext';

export function ClientLayout({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
```

### Available Hooks

#### `useAuth()`
Access auth state and functions.

```tsx
'use client';

import { useAuth } from '@/lib/auth/authContext';

export function UserMenu() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {isAuthenticated && (
        <>
          <p>Welcome {user?.fullName}</p>
          <button onClick={logout}>Logout</button>
        </>
      )}
    </div>
  );
}
```

#### `useRequireAuth()`
Automatically redirects if not authenticated.

```tsx
'use client';

import { useRequireAuth } from '@/lib/auth/authContext';

export function ProfilePage() {
  const { user, isLoading } = useRequireAuth();
  
  if (isLoading) return <div>Loading...</div>;
  
  return <div>Profile: {user?.email}</div>;
}
```

### Client Guard Components

#### `<ShowIfAuthenticated>`
Shows content only to authenticated users.

```tsx
<ShowIfAuthenticated fallback={<LoginButton />}>
  <UserDashboard />
</ShowIfAuthenticated>
```

#### `<ShowIfNotAuthenticated>`
Shows content only to guests.

```tsx
<ShowIfNotAuthenticated>
  <LoginPrompt />
</ShowIfNotAuthenticated>
```

## API Routes

### Protected API Routes

```tsx
import { requireAuthApi } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthApi();
    
    // User is authenticated
    return NextResponse.json({ data: 'protected data' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
```

### With Permission Check

```tsx
import { requireAuthApi, hasPermission } from '@/lib/auth/auth';

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuthApi();
    
    const canDelete = await hasPermission(user.id, 'users.delete', 'delete');
    
    if (!canDelete) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Perform deletion
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
```

## Permission System

### Permission Actions

- `read` - View/read access
- `write` - Edit/update access  
- `create` - Create new items
- `delete` - Delete items
- `manage` - Full access (grants all other actions)

### Resource Keys

Resource keys follow a hierarchical pattern:

```
dashboard              - Dashboard home
dashboard.users        - Users section
dashboard.roles        - Roles section
module.reports         - Reports module
entity.user.123        - Specific user entity
```

### Checking Permissions

```tsx
// Single permission check
const canEdit = await checkCurrentUserPermission('users', 'write');

// Multiple checks (parallel)
const [canCreate, canDelete, canManage] = await Promise.all([
  checkCurrentUserPermission('users', 'create'),
  checkCurrentUserPermission('users', 'delete'),
  checkCurrentUserPermission('users', 'manage'),
]);
```

### Permission Hierarchy

The `manage` action grants all other actions:

```tsx
// User has 'manage' permission
await checkCurrentUserPermission('users', 'read');   // true
await checkCurrentUserPermission('users', 'write');  // true
await checkCurrentUserPermission('users', 'delete'); // true
```

## Common Patterns

### Pattern 1: Conditional Actions Based on Permissions

```tsx
export default async function UsersPage() {
  const [canCreate, canDelete] = await Promise.all([
    checkCurrentUserPermission('users', 'create'),
    checkCurrentUserPermission('users', 'delete'),
  ]);
  
  return (
    <div>
      {canCreate && <CreateUserButton />}
      {canDelete && <DeleteUserButton />}
    </div>
  );
}
```

### Pattern 2: Require Permission with Fallback

```tsx
<ShowIfHasPermission 
  resourceKey="admin" 
  action="read"
  fallback={<RequestAccessMessage />}
>
  <AdminPanel />
</ShowIfHasPermission>
```

### Pattern 3: User-Specific Data

```tsx
export default async function ProfilePage({ params }) {
  const { locale } = await params;
  const user = await requireAuth(locale);
  
  // Load user-specific data
  const userData = await loadUserData(user.id);
  
  return <Profile data={userData} />;
}
```

### Pattern 4: Mixed Server/Client Auth

```tsx
// Server component
export default async function Page() {
  const user = await requireAuth('en');
  
  return (
    <div>
      <h1>Welcome {user.fullName}</h1>
      <ClientMenu initialUser={user} />
    </div>
  );
}

// Client component
'use client';

function ClientMenu({ initialUser }) {
  const { logout } = useAuth();
  
  return (
    <button onClick={logout}>Logout</button>
  );
}
```

## Troubleshooting

### Issue: "Unauthorized" error in dashboard

**Cause**: Invalid or expired token

**Solution**: 
1. Clear cookies
2. Login again
3. Check JWT_SECRET is consistent

### Issue: Redirected to login when already logged in

**Cause**: Token verification failing

**Solution**:
1. Check middleware.ts is running
2. Verify JWT_SECRET environment variable
3. Check browser console for errors

### Issue: Permission checks always return false

**Cause**: User lacks necessary permissions

**Solution**:
1. Check user's assigned roles
2. Verify role has correct permissions
3. Use admin panel to assign permissions

### Issue: Client components don't have auth state

**Cause**: AuthProvider not wrapping components

**Solution**:
Add AuthProvider wrapper:
```tsx
<AuthProvider initialUser={user}>
  {children}
</AuthProvider>
```

### Issue: Middleware not protecting routes

**Cause**: Incorrect matcher configuration

**Solution**:
Check middleware.ts matcher includes your routes

## Best Practices

1. **Use middleware for protection** - Don't manually check auth in layouts
2. **Parallelize permission checks** - Use Promise.all for multiple checks
3. **Use auth guards** - Cleaner than manual if statements
4. **Cache user data** - Avoid repeated database queries
5. **Type everything** - Leverage TypeScript for safety
6. **Handle loading states** - Show loading UI in client components
7. **Test permissions** - Verify access control works correctly

## API Reference

### Server Functions

| Function | Returns | Use Case |
|----------|---------|----------|
| `getCurrentUser()` | `AuthUser \| null` | Optional auth |
| `requireAuth(locale)` | `AuthUser` | Protected pages |
| `requireAuthApi()` | `AuthUser` | API routes |
| `checkCurrentUserPermission(resource, action)` | `boolean` | Permission check |
| `requirePermission(resource, action, locale)` | `AuthUser` | Require permission |
| `hasPermission(userId, resource, action)` | `boolean` | Check user permission |

### Client Hooks

| Hook | Returns | Use Case |
|------|---------|----------|
| `useAuth()` | Auth state & functions | Access auth in client |
| `useRequireAuth()` | Auth state | Require auth in client |
| `useIsAuthenticated()` | `{ isAuthenticated, isLoading }` | Check auth status |

### Components

| Component | Props | Use Case |
|-----------|-------|----------|
| `<RequireAuth>` | `locale, children` | Server: Require auth |
| `<RequirePermission>` | `resourceKey, action, locale, children` | Server: Require permission |
| `<ShowIfHasPermission>` | `resourceKey, action, fallback, children` | Server: Conditional render |
| `<ShowIfAuthenticated>` | `fallback, children` | Client: Show if authed |
| `<ShowIfNotAuthenticated>` | `children` | Client: Show if guest |

## Support

For more details, see:
- [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md) - Full architecture
- [AUTH_QUICK_REFERENCE.md](./AUTH_QUICK_REFERENCE.md) - Quick examples
- [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md) - What changed
