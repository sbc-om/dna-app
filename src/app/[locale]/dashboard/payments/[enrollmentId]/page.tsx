import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { findEnrollmentById } from '@/lib/db/repositories/enrollmentRepository';
import { findCourseById } from '@/lib/db/repositories/courseRepository';
import { findUserById } from '@/lib/db/repositories/userRepository';
import { getAdminSettings } from '@/lib/db/repositories/adminSettingsRepository';
import PaymentUploadClient from '@/components/PaymentUploadClient';

interface PageProps {
  params: Promise<{ locale: string; enrollmentId: string }>;
}

export default async function PaymentUploadPage({ params }: PageProps) {
  const { locale, enrollmentId } = await params;
  const currentUser = await getCurrentUser();

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

  // Verify parent owns this enrollment
  if (enrollment.parentId !== currentUser.id) {
    redirect(`/${locale}/dashboard/payments`);
  }

  const course = await findCourseById(enrollment.courseId);
  const student = await findUserById(enrollment.studentId);
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
