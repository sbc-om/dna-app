import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { hasRolePermission } from '@/lib/db/repositories/rolePermissionRepository';
import ProgramsManagementClient from '@/components/ProgramsManagementClient';
import type { Locale } from '@/config/i18n';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProgramsPage({ params }: PageProps) {
  const { locale } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/${locale}/auth/login`);
  }

  const canManagePrograms = await hasRolePermission(currentUser.role, 'canManagePrograms');
  if (!canManagePrograms) {
    redirect(`/${locale}/dashboard/forbidden`);
  }

  const dict = await getDictionary(locale as 'en' | 'ar');

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <ProgramsManagementClient locale={locale as Locale} dict={dict} />
    </div>
  );
}
