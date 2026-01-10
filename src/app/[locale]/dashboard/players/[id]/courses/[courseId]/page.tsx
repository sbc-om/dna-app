import { requireAuth } from '@/lib/auth/auth';
import { requireAcademyContext } from '@/lib/academies/academyContext';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { findUserById } from '@/lib/db/repositories/userRepository';
import { findCourseById } from '@/lib/db/repositories/courseRepository';
import { notFound, redirect } from 'next/navigation';
import { CourseDetailClient } from '@/components/CourseDetailClient';
import { requireUserInAcademy } from '@/lib/academies/academyGuards';

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; courseId: string }>;
}) {
  const { locale, id, courseId } = await params as { locale: Locale; id: string; courseId: string };
  const dictionary = await getDictionary(locale);
  const user = await requireAuth(locale);
  const academyCtx = await requireAcademyContext(locale);

  // Fetch the course first so admins can resolve the correct academy context even if the selected academy differs.
  const course = await findCourseById(courseId);
  if (!course) {
    notFound();
  }

  const academyId = user.role === 'admin' ? course.academyId : academyCtx.academyId;

  // For non-admin users, the course must belong to the selected academy.
  if (user.role !== 'admin' && course.academyId !== academyCtx.academyId) {
    notFound();
  }

  // Prevent cross-academy access via global user IDs.
  await requireUserInAcademy({ academyId, userId: id });

  // Fetch the kid
  const kid = await findUserById(id);

  if (!kid) {
    notFound();
  }

  // Security check: Only Admin, Parent of the kid, or Coach can view this
  const isParent = user.role === 'parent' && kid.parentId === user.id;
  const isAdmin = user.role === 'admin';
  const isCoach = user.role === 'coach' && course.coachId === user.id;

  if (!isParent && !isAdmin && !isCoach) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      <CourseDetailClient
        dictionary={dictionary}
        locale={locale}
        kid={kid}
        course={course}
      />
    </div>
  );
}
