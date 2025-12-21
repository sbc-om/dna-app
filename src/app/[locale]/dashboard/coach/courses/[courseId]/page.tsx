import { requireAuth } from '@/lib/auth/auth';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { findCourseById } from '@/lib/db/repositories/courseRepository';
import { getPaidEnrollmentsByCourseId } from '@/lib/db/repositories/enrollmentRepository';
import { getUsersByIds } from '@/lib/db/repositories/userRepository';
import type { Enrollment } from '@/lib/db/repositories/enrollmentRepository';
import type { User } from '@/lib/db/repositories/userRepository';
import { notFound, redirect } from 'next/navigation';
import { CoachCourseDetailClient } from '@/components/CoachCourseDetailClient';

interface PageProps {
  params: Promise<{
    locale: Locale;
    courseId: string;
  }>;
}

export default async function CoachCoursePage(props: PageProps) {
  const { locale, courseId } = await props.params;
  const dictionary = await getDictionary(locale);

  const user = await requireAuth();
  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  if (user.role !== 'coach') {
    redirect(`/${locale}/dashboard`);
  }

  const course = await findCourseById(courseId);
  if (!course) {
    notFound();
  }

  // Ensure coach owns this course
  if (course.coachId !== user.id) {
    redirect(`/${locale}/dashboard`);
  }

  // Get enrollments and students
  const enrollments = await getPaidEnrollmentsByCourseId(courseId);
  const studentIds = enrollments.map((e) => e.studentId);
  const students = studentIds.length > 0 ? await getUsersByIds(studentIds) : [];

  const roster: Array<{ enrollment: Enrollment; student: User }> = enrollments
    .map((enrollment) => {
      const student = students.find((s) => s.id === enrollment.studentId);
      if (!student) {
        return null;
      }
      return { enrollment, student };
    })
    .filter((item): item is { enrollment: Enrollment; student: User } => item !== null);

  return (
    <CoachCourseDetailClient
      course={course}
      roster={roster}
      dictionary={dictionary}
      locale={locale}
    />
  );
}
