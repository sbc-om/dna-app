import { requireAuth } from '@/lib/auth/auth';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { findCourseById } from '@/lib/db/repositories/courseRepository';
import { getSessionPlansByCourseId } from '@/lib/db/repositories/sessionPlanRepository';
import { notFound, redirect } from 'next/navigation';
import NewSessionClient from '@/components/NewSessionClient';

export default async function NewSessionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params as { locale: Locale; id: string };
  const dictionary = await getDictionary(locale);
  const user = await requireAuth(locale);

  // Only admin and coach can create sessions
  if (user.role !== 'admin' && user.role !== 'coach') {
    redirect(`/${locale}/dashboard/forbidden`);
  }

  // Fetch the course
  const course = await findCourseById(id);

  if (!course) {
    notFound();
  }

  // Get existing sessions to calculate next session number
  const existingSessions = getSessionPlansByCourseId(id);
  const nextSessionNumber = existingSessions.length > 0 
    ? Math.max(...existingSessions.map(s => s.sessionNumber)) + 1 
    : 1;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-5xl">
      <NewSessionClient
        locale={locale}
        dictionary={dictionary}
        course={course}
        nextSessionNumber={nextSessionNumber}
      />
    </div>
  );
}
