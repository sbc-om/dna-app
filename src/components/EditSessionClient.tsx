'use client';

import { useRouter } from 'next/navigation';
import { SessionPlanEditor } from './SessionPlanEditor';
import { PageContainer, PageHeader } from './ui/page-layout';
import type { Course } from '@/lib/db/repositories/courseRepository';
import type { SessionPlan } from '@/lib/db/repositories/sessionPlanRepository';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Locale } from '@/config/i18n';

interface EditSessionClientProps {
  locale: Locale;
  dictionary: Dictionary;
  course: Course;
  sessionPlan: SessionPlan;
}

export default function EditSessionClient({
  locale,
  dictionary,
  course,
  sessionPlan,
}: EditSessionClientProps) {
  const router = useRouter();

  const courseName =
    locale === 'ar'
      ? (course.nameAr || course.name)
      : course.name;
  const sessionNumberLabel = dictionary.courses?.sessionNumber || 'Session #';
  const sessionNumberText =
    locale === 'ar'
      ? `${sessionNumberLabel} ${sessionPlan.sessionNumber}`
      : `${sessionNumberLabel}${sessionPlan.sessionNumber}`;

  const handleSuccess = () => {
    router.refresh();
    router.push(`/${locale}/dashboard/courses/${course.id}/edit?tab=sessions`);
  };

  const handleCancel = () => {
    router.push(`/${locale}/dashboard/courses/${course.id}/edit?tab=sessions`);
  };

  return (
    <PageContainer maxWidth="4xl">
      <PageHeader
        title={dictionary.courses?.editSession || 'Edit Session'}
        description={`${courseName} • ${sessionNumberText}`}
      />

      <SessionPlanEditor
        courseId={course.id}
        sessionNumber={sessionPlan.sessionNumber}
        sessionDate={sessionPlan.sessionDate}
        existingPlan={sessionPlan}
        locale={locale}
        dictionary={dictionary}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </PageContainer>
  );
}
