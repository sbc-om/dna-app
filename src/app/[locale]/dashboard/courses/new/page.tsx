import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { hasRolePermission } from '@/lib/db/repositories/rolePermissionRepository';
import CreateCourseClient from '@/components/CreateCourseClient';
import type { Locale } from '@/config/i18n';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewCoursePage({ params }: PageProps) {
  const { locale } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/${locale}/auth/login`);
  }

  // Check if user has permission to manage courses
  const canManageCourses = await hasRolePermission(currentUser.role, 'canManageCourses');
  
  if (!canManageCourses) {
    redirect(`/${locale}/dashboard/forbidden`);
  }

  const dict = await getDictionary(locale as 'en' | 'ar');

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      <CreateCourseClient locale={locale as Locale} dict={dict} />
    </div>
  );
}
