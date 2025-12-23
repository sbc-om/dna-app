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
    canManageAcademies: boolean;
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
    canManageCourses: boolean;
    canViewPayments: boolean;
    canSendWhatsApp: boolean;
  };
  updatedAt: string;
  updatedBy: string;
}

const ROLE_PERMISSIONS_PREFIX = 'role_permissions:';

const DEFAULT_PERMISSIONS: Record<UserRole, RolePermission['permissions']> = {
  [ROLES.ADMIN]: {
    canAccessDashboard: true,
    canManageUsers: true,
    canManageRoles: true,
    canManageAcademies: true,
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
    canManageCourses: true,
    canViewPayments: true,
    canSendWhatsApp: true,
  },
  [ROLES.MANAGER]: {
    canAccessDashboard: true,
    canManageUsers: true,
    canManageRoles: true,
    canManageAcademies: false,
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
    canManageCourses: true,
    canViewPayments: true,
    canSendWhatsApp: true,
  },
  [ROLES.COACH]: {
    canAccessDashboard: true,
    canManageUsers: false,
    canManageRoles: false,
    canManageAcademies: false,
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
    canManageCourses: false,
    canViewPayments: false,
    canSendWhatsApp: true,
  },
  [ROLES.PARENT]: {
    canAccessDashboard: true,
    canManageUsers: false,
    canManageRoles: false,
    canManageAcademies: false,
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
    canManageCourses: false,
    canViewPayments: true,
    canSendWhatsApp: false,
  },
  [ROLES.KID]: {
    canAccessDashboard: true,
    canManageUsers: false,
    canManageRoles: false,
    canManageAcademies: false,
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
    canManageCourses: false,
    canViewPayments: false,
    canSendWhatsApp: false,
  },
};

function mergeWithDefaultPermissions(role: UserRole, stored: any): { merged: RolePermission['permissions']; changed: boolean } {
  const defaults = DEFAULT_PERMISSIONS[role];
  const storedPerms = (stored || {}) as Partial<RolePermission['permissions']>;
  const merged = { ...defaults, ...storedPerms };
  const changed = (Object.keys(defaults) as Array<keyof RolePermission['permissions']>).some(
    (k) => typeof storedPerms[k] !== 'boolean'
  );
  return { merged, changed };
}

/**
 * Get permissions for a specific role
 */
export async function getRolePermissions(role: UserRole): Promise<RolePermission | null> {
  const db = getDatabase();
  const permissions = await db.get(`${ROLE_PERMISSIONS_PREFIX}${role}`);
  if (!permissions) {
    // Return defaults without persisting.
    // This keeps the database minimal/empty unless permissions are explicitly updated.
    return {
      id: 'default',
      role,
      permissions: DEFAULT_PERMISSIONS[role],
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    };
  }

  const existing = permissions as RolePermission;
  const { merged, changed } = mergeWithDefaultPermissions(role, (existing as any).permissions);

  if (!changed) return existing;

  const backfilled: RolePermission = {
    ...existing,
    permissions: merged,
    updatedAt: new Date().toISOString(),
    updatedBy: existing.updatedBy || 'system',
  };
  await db.put(`${ROLE_PERMISSIONS_PREFIX}${role}`, backfilled);
  return backfilled;
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
  for (const [role, permissions] of Object.entries(DEFAULT_PERMISSIONS)) {
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
