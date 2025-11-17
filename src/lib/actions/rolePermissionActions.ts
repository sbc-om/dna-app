'use server';

import { requireAdmin, getCurrentUser } from '@/lib/auth/auth';
import { Locale } from '@/config/i18n';
import {
  getAllRolePermissions,
  updateRolePermissions,
  RolePermission,
} from '@/lib/db/repositories/rolePermissionRepository';
import { UserRole } from '@/config/roles';

export async function getRolePermissionsAction() {
  try {
    const rolePermissions = await getAllRolePermissions();
    return {
      success: true,
      rolePermissions,
    };
  } catch (error) {
    console.error('Error getting role permissions:', error);
    return {
      success: false,
      error: 'Failed to get role permissions',
    };
  }
}

export async function updateRolePermissionsAction(
  role: UserRole,
  permissions: RolePermission['permissions']
) {
  try {
    // Only admin can update role permissions
    const locale = 'en' as Locale; // TODO: get from context
    await requireAdmin(locale);

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const updated = await updateRolePermissions(role, permissions, currentUser.id);

    return {
      success: true,
      rolePermission: updated,
    };
  } catch (error) {
    console.error('Error updating role permissions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update role permissions',
    };
  }
}
