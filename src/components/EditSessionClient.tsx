'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { SessionPlanEditor } from './SessionPlanEditor';
import type { Course } from '@/lib/db/repositories/courseRepository';
import type { SessionPlan } from '@/lib/db/repositories/sessionPlanRepository';

interface EditSessionClientProps {
  locale: string;
  dictionary: any;
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

  const handleSuccess = () => {
    router.push(`/${locale}/dashboard/courses/${course.id}/edit?tab=sessions`);
  };

  const handleCancel = () => {
    router.push(`/${locale}/dashboard/courses/${course.id}/edit?tab=sessions`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {dictionary.courses?.editSession || 'Edit Session'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {locale === 'ar' 
              ? `${course.nameAr} - الجلسة رقم ${sessionPlan.sessionNumber}`
              : `${course.name} - Session #${sessionPlan.sessionNumber}`}
          </p>
        </div>
      </div>

      {/* Session Editor */}
      <SessionPlanEditor
        courseId={course.id}
        sessionNumber={sessionPlan.sessionNumber}
        sessionDate={sessionPlan.sessionDate}
        existingPlan={sessionPlan}
        locale={locale as 'en' | 'ar'}
        dictionary={dictionary}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
