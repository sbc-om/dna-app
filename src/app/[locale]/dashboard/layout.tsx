import { ReactNode } from 'react';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale, localeDirections } from '@/config/i18n';
import { requireAuth } from '@/lib/auth/auth';
import { DashboardLayoutClient } from '@/components/DashboardLayoutClient';
import { hasPermission, ROLE_PERMISSIONS } from '@/config/roles';

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
  const userPermissions = ROLE_PERMISSIONS[user.role];
  const accessibleResources: string[] = [];
  
  if (userPermissions.canAccessDashboard) {
    accessibleResources.push('dashboard');
  }
  if (userPermissions.canManageUsers) {
    accessibleResources.push('dashboard.users', 'dashboard.roles');
  }
  if (userPermissions.canManageAppointments) {
    accessibleResources.push('dashboard.appointments');
  }
  if (userPermissions.canManageSchedules) {
    accessibleResources.push('dashboard.schedules');
  }
  if (userPermissions.canViewReports) {
    accessibleResources.push('dashboard.notifications');
  }

  // Transform user for DashboardHeader
  const headerUser = {
    email: user.email,
    fullName: user.fullName,
    role: user.role,
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
