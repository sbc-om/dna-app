'use client';

import { useRouter } from 'next/navigation';
import { SessionPlanEditor } from './SessionPlanEditor';
import { PageContainer, PageHeader } from './ui/page-layout';
import type { Course } from '@/lib/db/repositories/courseRepository';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Locale } from '@/config/i18n';

interface NewSessionClientProps {
  locale: Locale;
  dictionary: Dictionary;
  course: Course;
  nextSessionNumber: number;
}

export default function NewSessionClient({
  locale,
  dictionary,
  course,
  nextSessionNumber,
}: NewSessionClientProps) {
  const router = useRouter();

  const courseName =
    locale === 'ar'
      ? (course.nameAr || course.name)
      : course.name;
  const sessionNumberLabel = dictionary.courses?.sessionNumber || 'Session #';
  const sessionNumberText =
    locale === 'ar'
      ? `${sessionNumberLabel} ${nextSessionNumber}`
      : `${sessionNumberLabel}${nextSessionNumber}`;

  const handleSuccess = () => {
    router.refresh();
    router.push(`/${locale}/dashboard/courses/${course.id}/edit?tab=sessions`);
  };

  const handleCancel = () => {
    router.push(`/${locale}/dashboard/courses/${course.id}/edit?tab=sessions`);
  };

  // Calculate default session date (next day from last session or today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <PageContainer maxWidth="4xl">
      <PageHeader
        title={dictionary.courses?.addSession || 'Add New Session'}
        description={`${courseName} • ${sessionNumberText}`}
      />

      {/* Session Editor */}
      <SessionPlanEditor
        courseId={course.id}
        sessionNumber={nextSessionNumber}
        sessionDate={today}
        locale={locale}
        dictionary={dictionary}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </PageContainer>
  );
}
