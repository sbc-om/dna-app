import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth';
import { requireAcademyContext } from '@/lib/academies/academyContext';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { findEnrollmentById } from '@/lib/db/repositories/enrollmentRepository';
import { findCourseById } from '@/lib/db/repositories/courseRepository';
import { findUserById } from '@/lib/db/repositories/userRepository';
import { getAdminSettings } from '@/lib/db/repositories/adminSettingsRepository';
import PaymentUploadClient from '@/components/PaymentUploadClient';
import { requireUserInAcademy } from '@/lib/academies/academyGuards';

interface PageProps {
  params: Promise<{ locale: string; enrollmentId: string }>;
}

export default async function PaymentUploadPage({ params }: PageProps) {
  const { locale, enrollmentId } = await params;
  const currentUser = await getCurrentUser();

  const academyCtx = await requireAcademyContext(locale);

  if (!currentUser) {
    redirect(`/${locale}/auth/login`);
  }

  // Only parents can access this page
  if (currentUser.role !== 'parent') {
    redirect(`/${locale}/dashboard/payments`);
  }

  const enrollment = await findEnrollmentById(enrollmentId);
  
  if (!enrollment) {
    redirect(`/${locale}/dashboard/payments`);
  }

  // Enrollment must belong to the currently selected academy.
  if (enrollment.academyId !== academyCtx.academyId) {
    redirect(`/${locale}/dashboard/payments`);
  }

  // Verify parent owns this enrollment
  if (enrollment.parentId !== currentUser.id) {
    redirect(`/${locale}/dashboard/payments`);
  }

  const course = await findCourseById(enrollment.courseId);
  const student = await findUserById(enrollment.studentId);

  if (course && course.academyId !== academyCtx.academyId) {
    redirect(`/${locale}/dashboard/payments`);
  }

  if (student) {
    await requireUserInAcademy({ academyId: academyCtx.academyId, userId: student.id });
  }
  const adminSettings = await getAdminSettings();
  const dict = await getDictionary(locale as Locale);

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <PaymentUploadClient
        locale={locale}
        dict={dict}
        enrollment={enrollment}
        course={course}
        student={student}
        adminSettings={adminSettings}
      />
    </div>
  );
}
