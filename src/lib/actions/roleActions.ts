'use server';

import { revalidatePath } from 'next/cache';
import { createRole, listRoles, deleteRole } from '@/lib/db/repositories/roleRepository';
import { createPermission } from '@/lib/db/repositories/permissionRepository';
import { RoleFormData } from '@/components/CreateRoleDialog';
import { requirePermission } from '@/lib/auth/auth';

export async function createRoleAction(data: RoleFormData) {
  try {
    // Check permission
    await requirePermission('dashboard.roles', 'create');
    
    const permissionIds: string[] = [];

    for (const permissionId of data.permissionIds) {
      const [resourceKey, action] = permissionId.split(':');
      
      const permission = await createPermission({
        resourceKey,
        resourceType: 'module',
        action: action as any,
      });

      permissionIds.push(permission.id);
    }

    const role = await createRole({
      name: data.name,
      description: data.description,
      permissionIds,
    });

    revalidatePath('/dashboard/roles');
    return { success: true, role };
  } catch (error) {
    console.error('Error creating role:', error);
    return { success: false, error: String(error) };
  }
}

export async function listRolesAction() {
  try {
    // Check permission
    await requirePermission('dashboard.roles', 'read');
    
    const roles = await listRoles();
    return { success: true, roles };
  } catch (error) {
    console.error('Error listing roles:', error);
    return { success: false, error: String(error), roles: [] };
  }
}

export async function deleteRoleAction(roleId: string) {
  try {
    // Check permission
    await requirePermission('dashboard.roles', 'delete');
    
    await deleteRole(roleId);
    revalidatePath('/dashboard/roles');
    return { success: true };
  } catch (error) {
    console.error('Error deleting role:', error);
    return { success: false, error: String(error) };
  }
}
