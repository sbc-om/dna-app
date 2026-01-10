import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth';
import { findEnrollmentById } from '@/lib/db/repositories/enrollmentRepository';
import { findCourseById } from '@/lib/db/repositories/courseRepository';
import { findUserById } from '@/lib/db/repositories/userRepository';
import PaymentReviewClient from '@/components/PaymentReviewClient';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { requireUserInAcademy } from '@/lib/academies/academyGuards';

interface PageProps {
  params: Promise<{
    locale: Locale;
    enrollmentId: string;
  }>;
}

export default async function PaymentReviewPage({ params }: PageProps) {
  const { locale, enrollmentId } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/${locale}/auth/login`);
  }

  // Only admin can review payments
  if (currentUser.role !== 'admin') {
    redirect(`/${locale}/dashboard/forbidden`);
  }

  const enrollment = await findEnrollmentById(enrollmentId);

  if (!enrollment) {
    notFound();
  }

  // Admins can review enrollments across academies; resolve academy from the enrollment.
  const academyId = enrollment.academyId;

  const [course, student, dict] = await Promise.all([
    findCourseById(enrollment.courseId),
    findUserById(enrollment.studentId),
    getDictionary(locale),
  ]);

  if (course && course.academyId !== academyId) {
    notFound();
  }

  if (student) {
    await requireUserInAcademy({ academyId, userId: student.id });
  }

  return (
    <PaymentReviewClient
      locale={locale}
      dict={dict}
      enrollment={enrollment}
      course={course}
      student={student}
    />
  );
}
