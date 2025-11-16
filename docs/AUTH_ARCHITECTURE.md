# Authentication & Dashboard Architecture

## Overview

This document describes the refactored authentication and dashboard structure for the DNA Web App, following Next.js 16 best practices.

## Architecture Highlights

### 1. **Proxy-Based Route Protection (Next.js 16)**
- **File**: `src/proxy.ts`
- Routes are protected at the edge before rendering
- Automatic redirects for unauthenticated users
- Prevents authenticated users from accessing auth pages
- Handles invalid tokens gracefully

### 2. **Clean Authentication Helpers**
- **File**: `src/lib/auth/auth.ts`
- Centralized session management
- Type-safe user interface
- Separate helpers for server components, API routes, and permission checks

Key Functions:
- `getCurrentUser()` - Get current user or null
- `requireAuth(locale)` - Require auth with redirect
- `requireAuthApi()` - Require auth for API routes
- `checkCurrentUserPermission(resource, action)` - Check permissions
- `requirePermission(resource, action, locale)` - Require specific permission

### 3. **Client-Side Auth Context**
- **File**: `src/lib/auth/authContext.tsx`
- React Context for client components
- Provides: `user`, `isLoading`, `isAuthenticated`, `login()`, `logout()`
- Use `useAuth()` hook in client components

### 4. **Auth Guard Components**

#### Server Components (`src/lib/auth/authGuards.tsx`):
- `<RequireAuth>` - Wrap content requiring authentication
- `<RequirePermission>` - Wrap content requiring specific permission
- `<ShowIfHasPermission>` - Conditionally show based on permission
- `<ShowIfNoPermission>` - Show if user lacks permission

#### Client Components (`src/lib/auth/authGuardsClient.tsx`):
- `<ShowIfAuthenticated>` - Show only to authenticated users
- `<ShowIfNotAuthenticated>` - Show only to guests
- `useIsAuthenticated()` - Hook for auth status

### 5. **Simplified Dashboard Layout**
- **File**: `src/app/[locale]/dashboard/layout.tsx`
- No duplicate auth logic (middleware handles it)
- Uses `requireAuth()` as safety net
- Loads user permissions for sidebar

### 6. **API Routes**
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Clear session
- `GET /api/auth/me` - Get current user info

## Usage Examples

### In Server Components

```tsx
import { requireAuth, checkCurrentUserPermission } from '@/lib/auth/auth';

export default async function MyPage() {
  // Get authenticated user
  const user = await requireAuth('en');
  
  // Check permission
  const canEdit = await checkCurrentUserPermission('resource.key', 'write');
  
  return <div>Hello {user.fullName}</div>;
}
```

### With Auth Guards (Server)

```tsx
import { RequirePermission, ShowIfHasPermission } from '@/lib/auth/authGuards';

export default async function MyPage() {
  return (
    <RequirePermission resourceKey="admin.panel" action="read">
      <div>Admin content</div>
      
      <ShowIfHasPermission resourceKey="users.delete" action="delete">
        <button>Delete User</button>
      </ShowIfHasPermission>
    </RequirePermission>
  );
}
```

### In Client Components

```tsx
'use client';

import { useAuth } from '@/lib/auth/authContext';
import { ShowIfAuthenticated } from '@/lib/auth/authGuardsClient';

export function MyClientComponent() {
  const { user, isLoading, logout } = useAuth();
  
  return (
    <ShowIfAuthenticated fallback={<div>Please login</div>}>
      <div>Welcome {user?.fullName}</div>
      <button onClick={logout}>Logout</button>
    </ShowIfAuthenticated>
  );
}
```

### In API Routes

```tsx
import { requireAuthApi } from '@/lib/auth/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthApi();
    // ... handle request
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

## Flow Diagrams

### Authentication Flow

```
1. User visits /dashboard
2. Proxy checks auth-token cookie
3. If no token → Redirect to /login
4. If invalid token → Clear cookie, redirect to /login  
5. If valid token → Allow access
6. Dashboard layout calls requireAuth() as safety check
7. Page renders with user data
```

### Login Flow

```
1. User submits credentials
2. POST /api/auth/login validates credentials
3. Create JWT token with createSession()
4. Set httpOnly cookie
5. Return user data
6. Client redirects to dashboard
7. Middleware allows access
```

### Permission Check Flow

```
1. Server component calls checkCurrentUserPermission()
2. Get current user from token
3. Load user's direct permissions
4. Load permissions from user's roles
5. Combine all permissions
6. Check if required permission exists
7. Check for 'manage' permission (grants all actions)
8. Return true/false
```

## File Structure

```
src/
├── proxy.ts                               # Route protection (Next.js 16)
├── lib/
│   └── auth/
│       ├── auth.ts                        # Core auth helpers
│       ├── authContext.tsx                # Client context
│       ├── authGuards.tsx                 # Server guard components
│       └── authGuardsClient.tsx           # Client guard components
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts             # Login endpoint
│   │       ├── logout/route.ts            # Logout endpoint
│   │       └── me/route.ts                # Get current user
│   └── [locale]/
│       ├── auth/
│       │   ├── login/page.tsx             # Login page
│       │   └── register/page.tsx          # Register page
│       └── dashboard/
│           ├── layout.tsx                 # Dashboard layout
│           └── page.tsx                   # Dashboard home
```

## Security Considerations

1. **HttpOnly Cookies** - Tokens stored in httpOnly cookies (not accessible via JS)
2. **Middleware Protection** - All routes protected at the edge
3. **Token Expiration** - 7-day expiration with automatic cleanup
4. **Permission Checks** - Fine-grained access control per resource
5. **Type Safety** - Full TypeScript types throughout

## Migration Guide

### Before (Old Pattern)
```tsx
// Layout doing auth manually
const token = cookieStore.get('auth-token');
if (!token) redirect('/login');
const { payload } = await jwtVerify(token);
const user = await findUserById(payload.userId);
```

### After (New Pattern)
```tsx
// Let middleware handle auth, use helpers
const user = await requireAuth(locale);
```

## Best Practices

1. **Use middleware for route protection** - Don't check auth in layouts
2. **Use auth guards for conditional rendering** - Cleaner than if statements
3. **Parallelize permission checks** - Use Promise.all for multiple checks
4. **Cache permission results** - Consider caching for better performance
5. **Use type-safe helpers** - Always import from lib/auth/auth.ts

## Future Enhancements

- [ ] Add refresh token mechanism
- [ ] Implement rate limiting for auth endpoints
- [ ] Add OAuth/Social login support
- [ ] Implement session management (view all sessions, logout all)
- [ ] Add 2FA support
- [ ] Permission caching with Redis
- [ ] Audit logging for auth events
