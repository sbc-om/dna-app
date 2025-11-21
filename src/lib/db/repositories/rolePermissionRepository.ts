import { getDatabase, generateId } from '../lmdb';
import { UserRole, ROLES } from '@/config/roles';

/**
 * Dynamic Role Permissions Repository
 * Store and manage permissions for each of the 4 fixed roles
 */

export interface RolePermission {
  id: string;
  role: UserRole;
  permissions: {
    canAccessDashboard: boolean;
    canManageUsers: boolean;
    canManageRoles: boolean;
    canViewReports: boolean;
    canManageSchedules: boolean;
    canManageAppointments: boolean;
    canManageNotifications: boolean;
    canViewProfile: boolean;
    canEditProfile: boolean;
    canAccessSettings: boolean;
    canManageBackups: boolean;
    canAccessMessages: boolean;
    canCreateGroup: boolean;
    canSendPushNotifications: boolean;
  };
  updatedAt: string;
  updatedBy: string;
}

const ROLE_PERMISSIONS_PREFIX = 'role_permissions:';

/**
 * Get permissions for a specific role
 */
export async function getRolePermissions(role: UserRole): Promise<RolePermission | null> {
  const db = getDatabase();
  const permissions = await db.get(`${ROLE_PERMISSIONS_PREFIX}${role}`);
  return permissions || null;
}

/**
 * Get all role permissions (for all 4 roles)
 */
export async function getAllRolePermissions(): Promise<RolePermission[]> {
  const db = getDatabase();
  const allPermissions: RolePermission[] = [];

  for (const role of Object.values(ROLES)) {
    const permissions = await getRolePermissions(role);
    if (permissions) {
      allPermissions.push(permissions);
    }
  }

  return allPermissions;
}

/**
 * Update permissions for a specific role
 */
export async function updateRolePermissions(
  role: UserRole,
  permissions: RolePermission['permissions'],
  updatedBy: string
): Promise<RolePermission> {
  const db = getDatabase();
  
  const existing = await getRolePermissions(role);
  
  const rolePermission: RolePermission = {
    id: existing?.id || generateId(),
    role,
    permissions,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  await db.put(`${ROLE_PERMISSIONS_PREFIX}${role}`, rolePermission);
  
  return rolePermission;
}

/**
 * Initialize default permissions for all roles if not exists
 */
export async function initializeDefaultRolePermissions(): Promise<void> {
  const defaultPermissions: Record<UserRole, RolePermission['permissions']> = {
    [ROLES.ADMIN]: {
      canAccessDashboard: true,
      canManageUsers: true,
      canManageRoles: true,
      canViewReports: true,
      canManageSchedules: true,
      canManageAppointments: true,
      canManageNotifications: true,
      canViewProfile: true,
      canEditProfile: true,
      canAccessSettings: true,
      canManageBackups: true,
      canAccessMessages: true,
      canCreateGroup: true,
      canSendPushNotifications: true,
    },
    [ROLES.COACH]: {
      canAccessDashboard: true,
      canManageUsers: false,
      canManageRoles: false,
      canViewReports: true,
      canManageSchedules: true,
      canManageAppointments: true,
      canManageNotifications: true,
      canViewProfile: true,
      canEditProfile: true,
      canAccessSettings: false,
      canManageBackups: false,
      canAccessMessages: true,
      canCreateGroup: true,
      canSendPushNotifications: true,
    },
    [ROLES.PARENT]: {
      canAccessDashboard: true,
      canManageUsers: false,
      canManageRoles: false,
      canViewReports: false,
      canManageSchedules: false,
      canManageAppointments: true,
      canManageNotifications: false,
      canViewProfile: true,
      canEditProfile: true,
      canAccessSettings: false,
      canManageBackups: false,
      canAccessMessages: true,
      canCreateGroup: false,
      canSendPushNotifications: false,
    },
    [ROLES.KID]: {
      canAccessDashboard: true,
      canManageUsers: false,
      canManageRoles: false,
      canViewReports: false,
      canManageSchedules: false,
      canManageAppointments: false,
      canManageNotifications: false,
      canViewProfile: true,
      canEditProfile: false,
      canAccessSettings: false,
      canManageBackups: false,
      canAccessMessages: true,
      canCreateGroup: false,
      canSendPushNotifications: false,
    },
  };

  for (const [role, permissions] of Object.entries(defaultPermissions)) {
    const existing = await getRolePermissions(role as UserRole);
    if (!existing) {
      await updateRolePermissions(role as UserRole, permissions, 'system');
    }
  }
}

/**
 * Check if a role has a specific permission
 */
export async function hasRolePermission(
  role: UserRole,
  permission: keyof RolePermission['permissions']
): Promise<boolean> {
  const rolePermissions = await getRolePermissions(role);
  return rolePermissions?.permissions[permission] || false;
}
