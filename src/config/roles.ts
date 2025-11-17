/**
 * Simple Role System
 * Four fixed roles - no dynamic permissions
 */

export const ROLES = {
  ADMIN: 'admin',
  COACH: 'coach',
  PARENT: 'parent',
  KID: 'kid',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const ROLE_LABELS = {
  [ROLES.ADMIN]: {
    en: 'Administrator',
    ar: 'مدير',
  },
  [ROLES.COACH]: {
    en: 'Coach',
    ar: 'مدرب',
  },
  [ROLES.PARENT]: {
    en: 'Parent',
    ar: 'ولي أمر',
  },
  [ROLES.KID]: {
    en: 'Kid',
    ar: 'طفل',
  },
};

/**
 * Define what each role can access
 */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    canAccessDashboard: true,
    canManageUsers: true,
    canManageRoles: true,
    canViewReports: true,
    canManageAppointments: true,
    canManageSchedules: true,
    canViewAllData: true,
  },
  [ROLES.COACH]: {
    canAccessDashboard: true,
    canManageUsers: false,
    canManageRoles: false,
    canViewReports: true,
    canManageAppointments: true,
    canManageSchedules: true,
    canViewAllData: false,
  },
  [ROLES.PARENT]: {
    canAccessDashboard: true,
    canManageUsers: false,
    canManageRoles: false,
    canViewReports: false,
    canManageAppointments: true,
    canManageSchedules: false,
    canViewAllData: false,
  },
  [ROLES.KID]: {
    canAccessDashboard: true,
    canManageUsers: false,
    canManageRoles: false,
    canViewReports: false,
    canManageAppointments: false,
    canManageSchedules: false,
    canViewAllData: false,
  },
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: keyof typeof ROLE_PERMISSIONS.admin): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

/**
 * Check if role is admin
 */
export function isAdmin(role: UserRole): boolean {
  return role === ROLES.ADMIN;
}

/**
 * Check if role is coach
 */
export function isCoach(role: UserRole): boolean {
  return role === ROLES.COACH;
}

/**
 * Check if role is parent
 */
export function isParent(role: UserRole): boolean {
  return role === ROLES.PARENT;
}

/**
 * Check if role is kid
 */
export function isKid(role: UserRole): boolean {
  return role === ROLES.KID;
}
