'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { SessionPlanEditor } from './SessionPlanEditor';
import type { Course } from '@/lib/db/repositories/courseRepository';

interface NewSessionClientProps {
  locale: string;
  dictionary: any;
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

  const handleSuccess = () => {
    router.push(`/${locale}/dashboard/courses/${course.id}/edit?tab=sessions`);
  };

  const handleCancel = () => {
    router.push(`/${locale}/dashboard/courses/${course.id}/edit?tab=sessions`);
  };

  // Calculate default session date (next day from last session or today)
  const today = new Date().toISOString().split('T')[0];

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
            {dictionary.courses?.addSession || 'Add New Session'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {locale === 'ar' 
              ? `${course.nameAr} - الجلسة رقم ${nextSessionNumber}`
              : `${course.name} - Session #${nextSessionNumber}`}
          </p>
        </div>
      </div>

      {/* Session Editor */}
      <SessionPlanEditor
        courseId={course.id}
        sessionNumber={nextSessionNumber}
        sessionDate={today}
        locale={locale as 'en' | 'ar'}
        dictionary={dictionary}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
