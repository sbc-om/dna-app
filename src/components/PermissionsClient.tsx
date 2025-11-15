'use client';

import { Dictionary } from '@/lib/i18n/getDictionary';
import { User } from '@/lib/db/repositories/userRepository';
import { Role } from '@/lib/access-control/permissions';
import { Permission, RegisteredResource } from '@/lib/access-control/permissions';
import { PermissionsTable } from '@/components/PermissionsTable';

export interface PermissionsClientProps {
  dictionary: Dictionary;
  users: User[];
  roles: Role[];
  permissions: Permission[];
  resources: RegisteredResource[];
}

export function PermissionsClient({
  dictionary,
  users,
  roles,
  permissions,
  resources,
}: PermissionsClientProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{dictionary.permissions.title}</h1>
          <p className="text-muted-foreground mt-2">{dictionary.permissions.permissionList}</p>
        </div>
      </div>

      <PermissionsTable
        users={users}
        roles={roles}
        permissions={permissions}
        resources={resources}
        dictionary={dictionary}
      />
    </div>
  );
}
