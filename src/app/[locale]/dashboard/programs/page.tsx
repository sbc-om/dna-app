import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { hasRolePermission } from '@/lib/db/repositories/rolePermissionRepository';
import ProgramsManagementClient from '@/components/ProgramsManagementClient';
import CoachProgramsViewProfessional from '@/components/CoachProgramsViewProfessional';
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
  const canCoachPrograms = await hasRolePermission(currentUser.role, 'canCoachPrograms');

  if (!canManagePrograms && !canCoachPrograms) {
    redirect(`/${locale}/dashboard/forbidden`);
  }

  const dict = await getDictionary(locale as 'en' | 'ar');

  return (
    <>
      {canManagePrograms ? (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          <ProgramsManagementClient locale={locale as Locale} dict={dict} />
        </div>
      ) : (
        <CoachProgramsViewProfessional locale={locale as Locale} dict={dict} />
      )}
    </>
  );
}
