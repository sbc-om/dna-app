import { requireAuth } from '@/lib/auth/auth';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { findCourseById } from '@/lib/db/repositories/courseRepository';
import { notFound, redirect } from 'next/navigation';
import EditCourseClient from '@/components/EditCourseClient';

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params as { locale: Locale; id: string };
  const dictionary = await getDictionary(locale);
  const user = await requireAuth(locale);

  // Only admin can edit courses
  if (user.role !== 'admin') {
    redirect(`/${locale}/dashboard/forbidden`);
  }

  // Fetch the course
  const course = await findCourseById(id);

  if (!course) {
    notFound();
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl space-y-6">
        <EditCourseClient
          locale={locale}
          dict={dictionary}
          course={course}
        />
      </div>
    </div>
  );
}
