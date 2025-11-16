# Migration Checklist - Updating Existing Dashboard Pages

This checklist helps you update existing dashboard pages to use the new authentication structure.

## Step-by-Step Migration

### ✅ Step 1: Remove Manual Auth Checks

**Before:**
```tsx
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { findUserById } from '@/lib/db/repositories/userRepository';

export default async function MyPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');
  
  if (!token) {
    redirect('/login');
  }
  
  const { payload } = await jwtVerify(token.value, JWT_SECRET);
  const user = await findUserById(payload.userId);
  
  // ... rest of code
}
```

**After:**
```tsx
import { requireAuth } from '@/lib/auth/auth';

export default async function MyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await requireAuth(locale);
  
  // ... rest of code
}
```

### ✅ Step 2: Update Permission Checks

**Before:**
```tsx
const currentUser = await getCurrentUser();
const canCreate = currentUser ? await hasPermission(currentUser.id, 'users', 'create') : false;
const canDelete = currentUser ? await hasPermission(currentUser.id, 'users', 'delete') : false;
```

**After:**
```tsx
const [canCreate, canDelete] = await Promise.all([
  checkCurrentUserPermission('users', 'create'),
  checkCurrentUserPermission('users', 'delete'),
]);
```

### ✅ Step 3: Use Auth Guards

**Before:**
```tsx
export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  
  const hasAccess = await hasPermission(user.id, 'admin', 'read');
  if (!hasAccess) redirect('/forbidden');
  
  return <div>Admin content</div>;
}
```

**After:**
```tsx
import { RequirePermission } from '@/lib/auth/authGuards';

export default async function AdminPage({ params }) {
  const { locale } = await params;
  
  return (
    <RequirePermission resourceKey="admin" action="read" locale={locale}>
      <div>Admin content</div>
    </RequirePermission>
  );
}
```

### ✅ Step 4: Conditional Rendering

**Before:**
```tsx
const canEdit = await hasPermission(user.id, 'resource', 'write');

return (
  <div>
    {canEdit && <EditButton />}
  </div>
);
```

**After:**
```tsx
import { ShowIfHasPermission } from '@/lib/auth/authGuards';

return (
  <div>
    <ShowIfHasPermission resourceKey="resource" action="write">
      <EditButton />
    </ShowIfHasPermission>
  </div>
);
```

### ✅ Step 5: Update Imports

**Remove these imports:**
```tsx
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { findUserById } from '@/lib/db/repositories/userRepository';
```

**Add these imports:**
```tsx
import { requireAuth, checkCurrentUserPermission } from '@/lib/auth/auth';
import { ShowIfHasPermission } from '@/lib/auth/authGuards';
```

### ✅ Step 6: Update Client Components

**Before:**
```tsx
'use client';

export function MyClientComponent({ user }) {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };
  
  return (
    <div>
      <p>{user.email}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

**After:**
```tsx
'use client';

import { useAuth } from '@/lib/auth/authContext';

export function MyClientComponent() {
  const { user, logout } = useAuth();
  
  return (
    <div>
      <p>{user?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Common Patterns

### Pattern 1: Basic Protected Page

```tsx
import { requireAuth } from '@/lib/auth/auth';

export default async function ProtectedPage({ params }) {
  const { locale } = await params;
  const user = await requireAuth(locale);
  
  return <div>Hello {user.fullName}</div>;
}
```

### Pattern 2: Page with Permission Check

```tsx
import { requirePermission } from '@/lib/auth/auth';

export default async function AdminPage({ params }) {
  const { locale } = await params;
  const user = await requirePermission('admin.panel', 'read', locale);
  
  return <div>Admin Panel</div>;
}
```

### Pattern 3: Conditional Features

```tsx
import { checkCurrentUserPermission } from '@/lib/auth/auth';

export default async function DashboardPage() {
  const [canCreate, canEdit, canDelete] = await Promise.all([
    checkCurrentUserPermission('users', 'create'),
    checkCurrentUserPermission('users', 'write'),
    checkCurrentUserPermission('users', 'delete'),
  ]);
  
  return (
    <div>
      {canCreate && <CreateButton />}
      {canEdit && <EditButton />}
      {canDelete && <DeleteButton />}
    </div>
  );
}
```

### Pattern 4: With Auth Guards

```tsx
import { ShowIfHasPermission } from '@/lib/auth/authGuards';

export default async function UsersPage() {
  return (
    <div>
      <h1>Users</h1>
      
      <ShowIfHasPermission resourceKey="users" action="create">
        <CreateUserButton />
      </ShowIfHasPermission>
      
      <ShowIfHasPermission 
        resourceKey="users.advanced" 
        action="read"
        fallback={<p>Basic view only</p>}
      >
        <AdvancedUserTable />
      </ShowIfHasPermission>
    </div>
  );
}
```

## Page-by-Page Checklist

Update each dashboard page:

### Users Pages
- [ ] `src/app/[locale]/dashboard/users/page.tsx`
  - [ ] Replace manual auth with `requireAuth()`
  - [ ] Update permission checks to `checkCurrentUserPermission()`
  - [ ] Use auth guards where appropriate

### Roles Pages
- [ ] `src/app/[locale]/dashboard/roles/page.tsx`
  - [ ] Replace manual auth with `requireAuth()`
  - [ ] Update permission checks
  - [ ] Use auth guards

### Permissions Pages
- [ ] `src/app/[locale]/dashboard/permissions/page.tsx`
  - [ ] Replace manual auth with `requireAuth()`
  - [ ] Update permission checks

### Resources Pages
- [ ] `src/app/[locale]/dashboard/resources/page.tsx`
  - [ ] Replace manual auth with `requireAuth()`
  - [ ] Update permission checks

### Appointments Pages
- [ ] `src/app/[locale]/dashboard/appointments/page.tsx`
  - [ ] Replace manual auth with `requireAuth()`
  - [ ] Update permission checks

### Schedules Pages
- [ ] `src/app/[locale]/dashboard/schedules/page.tsx`
  - [ ] Replace manual auth with `requireAuth()`
  - [ ] Update permission checks

## Testing Each Page

After migrating each page, test:

1. **Unauthenticated Access**
   - Visit page without login
   - Should redirect to login page

2. **Authenticated Access**
   - Login as normal user
   - Should see page (if has permission)

3. **Permission-Based Features**
   - Login as user without permissions
   - Should hide/disable restricted features

4. **Permission-Based Pages**
   - Try accessing admin-only pages
   - Should redirect to forbidden page

5. **Client Components**
   - Check user state loads correctly
   - Test logout functionality

## Common Issues & Solutions

### Issue: "user is not defined"
**Solution**: Add `const user = await requireAuth(locale)` at the start of the page

### Issue: "Cannot read property 'id' of null"
**Solution**: Use `checkCurrentUserPermission()` instead of manually getting user first

### Issue: "Redirect not working"
**Solution**: Ensure you're passing the correct locale to `requireAuth(locale)`

### Issue: "Permission check always returns false"
**Solution**: Verify the resource key matches what's registered in the access control system

### Issue: "Client component has no auth state"
**Solution**: Wrap parent component with `<AuthProvider>`

## Verification

After migration, verify:

- [ ] No compile errors
- [ ] All imports are correct
- [ ] Auth checks work correctly
- [ ] Permission checks work correctly
- [ ] Redirects work as expected
- [ ] Client components have access to auth state
- [ ] All features work as before
- [ ] Code is cleaner and more maintainable

## Need Help?

Refer to:
- `docs/AUTH_IMPLEMENTATION_GUIDE.md` - Full implementation guide
- `docs/AUTH_QUICK_REFERENCE.md` - Quick examples
- `docs/AUTH_ARCHITECTURE.md` - Architecture details
