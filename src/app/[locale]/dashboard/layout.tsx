import { ReactNode } from 'react';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale, localeDirections } from '@/config/i18n';
import { getUserAccessibleResources } from '@/lib/access-control/checkAccess';
import { requireAuth } from '@/lib/auth/auth';
import { DashboardLayoutClient } from '@/components/DashboardLayoutClient';

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

  // Get authenticated user (middleware ensures user is authenticated)
  // requireAuth will redirect if somehow not authenticated
  const user = await requireAuth(locale);

  // Get user's accessible resources for sidebar
  const accessibleResources = await getUserAccessibleResources(user.id);

  // Transform user for DashboardHeader
  const headerUser = {
    email: user.email,
    fullName: user.fullName,
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
