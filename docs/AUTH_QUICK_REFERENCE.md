# Quick Reference: Authentication & Authorization

## Common Tasks

### 1. Protect a Page (Require Login)

The page is automatically protected by middleware. No extra code needed!

```tsx
// src/app/[locale]/dashboard/my-page/page.tsx
export default async function MyPage() {
  // User is already authenticated by middleware
  const user = await requireAuth(locale); // Optional safety check
  
  return <div>Protected content</div>;
}
```

### 2. Check Permission in Server Component

```tsx
import { checkCurrentUserPermission } from '@/lib/auth/auth';

export default async function MyPage() {
  const canEdit = await checkCurrentUserPermission('resource.key', 'write');
  
  return (
    <div>
      {canEdit && <button>Edit</button>}
    </div>
  );
}
```

### 3. Require Permission (Redirect if Not Allowed)

```tsx
import { requirePermission } from '@/lib/auth/auth';

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  // Will redirect to forbidden page if user lacks permission
  await requirePermission('admin.panel', 'read', locale);
  
  return <div>Admin content</div>;
}
```

### 4. Use Auth Guards (Server Components)

```tsx
import { ShowIfHasPermission } from '@/lib/auth/authGuards';

export default async function MyPage() {
  return (
    <div>
      <ShowIfHasPermission resourceKey="users.delete" action="delete">
        <button>Delete User</button>
      </ShowIfHasPermission>
      
      <ShowIfHasPermission 
        resourceKey="reports.view" 
        action="read"
        fallback={<p>You need permission to view reports</p>}
      >
        <ReportsComponent />
      </ShowIfHasPermission>
    </div>
  );
}
```

### 5. Client Component with Auth Context

```tsx
'use client';

import { useAuth } from '@/lib/auth/authContext';

export function UserProfile() {
  const { user, isLoading, logout } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <p>Welcome, {user?.fullName || user?.username}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 6. Conditional Rendering (Client)

```tsx
'use client';

import { ShowIfAuthenticated, ShowIfNotAuthenticated } from '@/lib/auth/authGuardsClient';

export function NavBar() {
  return (
    <nav>
      <ShowIfAuthenticated>
        <a href="/dashboard">Dashboard</a>
        <a href="/profile">Profile</a>
      </ShowIfAuthenticated>
      
      <ShowIfNotAuthenticated>
        <a href="/login">Login</a>
        <a href="/register">Sign Up</a>
      </ShowIfNotAuthenticated>
    </nav>
  );
}
```

### 7. Server Action with Auth

```tsx
'use server';

import { requireAuthApi } from '@/lib/auth/auth';

export async function deleteUser(userId: string) {
  const currentUser = await requireAuthApi();
  
  // Check permission
  const canDelete = await hasPermission(currentUser.id, 'users.delete', 'delete');
  
  if (!canDelete) {
    throw new Error('Forbidden');
  }
  
  // Perform deletion
  // ...
}
```

### 8. API Route with Auth

```tsx
import { requireAuthApi } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthApi();
    
    // Return user-specific data
    return NextResponse.json({ data: '...' });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

### 9. Multiple Permission Checks (Parallel)

```tsx
export default async function DashboardPage() {
  const [canCreateUsers, canEditRoles, canViewReports] = await Promise.all([
    checkCurrentUserPermission('users', 'create'),
    checkCurrentUserPermission('roles', 'write'),
    checkCurrentUserPermission('reports', 'read'),
  ]);
  
  return (
    <div>
      {canCreateUsers && <CreateUserButton />}
      {canEditRoles && <EditRolesButton />}
      {canViewReports && <ViewReportsLink />}
    </div>
  );
}
```

### 10. Custom Login Form

```tsx
'use client';

import { useAuth } from '@/lib/auth/authContext';
import { useRouter } from 'next/navigation';

export function CustomLoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const result = await login(
      formData.get('email') as string,
      formData.get('password') as string
    );
    
    if (result.success) {
      router.push('/dashboard');
    } else {
      alert(result.error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Login</button>
    </form>
  );
}
```

## Permission Actions

- `read` - View/read access
- `write` - Edit/update access
- `create` - Create new items
- `delete` - Delete items
- `manage` - Full access (grants all actions)

## Common Resource Keys

- `dashboard` - Dashboard home
- `dashboard.users` - Users management
- `dashboard.roles` - Roles management
- `dashboard.permissions` - Permissions management
- `dashboard.resources` - Resources management
- `dashboard.appointments` - Appointments
- `dashboard.schedules` - Schedules

## Auth Flow Overview

```
User Request → Middleware → Token Check → Route/Layout → Page Component
                    ↓
              No Token?
                    ↓
            Redirect to Login
```

## Tips

1. **Middleware handles protection** - Don't add auth checks in every layout
2. **Use auth guards** - Cleaner than manual if/else statements
3. **Parallel checks** - Use Promise.all for multiple permission checks
4. **Client state** - Use AuthContext for client-side auth state
5. **Type safety** - All helpers are fully typed
