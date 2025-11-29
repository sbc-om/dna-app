import { requireAuth } from '@/lib/auth/auth';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { findCourseById } from '@/lib/db/repositories/courseRepository';
import { getSessionPlanById } from '@/lib/db/repositories/sessionPlanRepository';
import { notFound, redirect } from 'next/navigation';
import EditSessionClient from '@/components/EditSessionClient';

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; sessionId: string }>;
}) {
  const { locale, id, sessionId } = await params as { locale: Locale; id: string; sessionId: string };
  const dictionary = await getDictionary(locale);
  const user = await requireAuth(locale);

  // Only admin and coach can edit sessions
  if (user.role !== 'admin' && user.role !== 'coach') {
    redirect(`/${locale}/dashboard/forbidden`);
  }

  // Fetch the course
  const course = await findCourseById(id);

  if (!course) {
    notFound();
  }

  // Fetch the session plan
  const sessionPlan = getSessionPlanById(sessionId);

  if (!sessionPlan) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-5xl">
      <EditSessionClient
        locale={locale}
        dictionary={dictionary}
        course={course}
        sessionPlan={sessionPlan}
      />
    </div>
  );
}
