import { ReactNode } from 'react';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale, localeDirections } from '@/config/i18n';
import { requireAuth } from '@/lib/auth/auth';
import { DashboardLayoutClient } from '@/components/DashboardLayoutClient';
import { getRolePermissions } from '@/lib/db/repositories/rolePermissionRepository';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
  const dictionary = await getDictionary(locale);
  const direction = localeDirections[locale];

  // Get authenticated user
  const user = await requireAuth(locale);

  // Build simple menu based on role permissions
  const rolePermissions = await getRolePermissions(user.role);
  const permissions = rolePermissions?.permissions;
  
  const accessibleResources: string[] = [];
  
  if (permissions?.canAccessDashboard) {
    accessibleResources.push('dashboard');
  }
  if (permissions?.canManageUsers) {
    accessibleResources.push('dashboard.users');
  }
  if (permissions?.canManageRoles) {
    accessibleResources.push('dashboard.roles');
  }
  if (permissions?.canManageAppointments) {
    accessibleResources.push('dashboard.appointments');
  }
  if (permissions?.canManageSchedules) {
    accessibleResources.push('dashboard.schedules');
  }
  if (permissions?.canManageNotifications) {
    accessibleResources.push('dashboard.notifications');
  }
  if (permissions?.canAccessMessages) {
    accessibleResources.push('dashboard.messages');
  }
  if (permissions?.canAccessSettings) {
    accessibleResources.push('dashboard.settings');
  }

  // Transform user for DashboardHeader
  const headerUser = {
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    profilePicture: user.profilePicture,
  };

  return (
    <DashboardLayoutClient
      dictionary={dictionary}
      user={headerUser}
      accessibleResources={accessibleResources}
      locale={locale}
      direction={direction}
    >
      {children}
    </DashboardLayoutClient>
  );
}
