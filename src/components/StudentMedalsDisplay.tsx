'use client';

import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getStudentMedalsAction, getStudentCourseMedalsAction } from '@/lib/actions/medalActions';
import type { StudentMedal, Medal } from '@/lib/db/repositories/medalRepository';

interface MedalDisplay extends StudentMedal {
  medal?: Medal;
}

interface StudentMedalsDisplayProps {
  studentId: string;
  courseId?: string; // Optional: filter by specific course
  title: string;
  description?: string;
  locale: 'en' | 'ar';
  onTotalPointsChange?: (totalPoints: number) => void;
}

export function StudentMedalsDisplay({
  studentId,
  courseId,
  title,
  description,
  locale,
  onTotalPointsChange,
}: StudentMedalsDisplayProps) {
  const [medals, setMedals] = useState<MedalDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedals();
  }, [studentId, courseId]);

  const loadMedals = async () => {
    setLoading(true);
    try {
      const result = courseId
        ? await getStudentCourseMedalsAction(studentId, courseId)
        : await getStudentMedalsAction(studentId);

      if (result.success && result.studentMedals) {
        // Medal details are already included from the server action
        setMedals(result.studentMedals);
        
        // Calculate and send total points to parent
        const totalPoints = result.studentMedals.reduce((sum, sm) => sum + (sm.medal?.points || 0), 0);
        onTotalPointsChange?.(totalPoints);
      }
    } catch (error) {
      console.error('Load student medals error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-[#262626] border-[#DDDDDD] dark:border-[#262626]">
        <CardHeader>
          <CardTitle className="text-[#262626] dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-[#FF5F02]" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-[#262626] dark:text-[#DDDDDD]">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (medals.length === 0) {
    return (
      <Card className="bg-white dark:bg-[#262626] border-[#DDDDDD] dark:border-[#262626]">
        <CardHeader>
          <CardTitle className="text-[#262626] dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-[#FF5F02]" />
            {title}
          </CardTitle>
          {description && (
            <p className="text-sm text-[#262626] dark:text-[#DDDDDD]">{description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Award className="w-12 h-12 mx-auto text-[#DDDDDD] mb-4" />
            <p className="text-[#262626] dark:text-[#DDDDDD]">
              {locale === 'ar' ? 'لم يتم منح أي ميداليات بعد' : 'No medals awarded yet'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group medals by type and count
  const medalCounts = medals.reduce((acc, sm) => {
    if (sm.medal) {
      const key = sm.medal.id;
      if (!acc[key]) {
        acc[key] = { medal: sm.medal, count: 0, lastAwarded: sm.awardedAt };
      }
      acc[key].count++;
      if (new Date(sm.awardedAt) > new Date(acc[key].lastAwarded)) {
        acc[key].lastAwarded = sm.awardedAt;
      }
    }
    return acc;
  }, {} as Record<string, { medal: Medal; count: number; lastAwarded: string }>);

  const uniqueMedals = Object.values(medalCounts);

  return (
    <Card className="bg-white dark:bg-[#262626] border-[#DDDDDD] dark:border-[#262626]">
      <CardHeader>
        <CardTitle className="text-[#262626] dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-[#FF5F02]" />
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-[#262626] dark:text-[#DDDDDD]">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {uniqueMedals.map(({ medal, count, lastAwarded }) => (
            <div
              key={medal.id}
              className="p-4 rounded-lg border-2 border-[#DDDDDD] dark:border-[#262626] bg-white dark:bg-[#262626] hover:border-[#FF5F02] transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="text-4xl">{medal.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-[#262626] dark:text-white truncate">
                    {locale === 'ar' ? medal.nameAr : medal.name}
                  </h4>
                  <p className="text-xs text-[#262626] dark:text-[#DDDDDD] mt-1 line-clamp-2">
                    {locale === 'ar' ? medal.descriptionAr : medal.description}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs font-semibold text-white px-2 py-1 rounded bg-[#FF5F02]">
                      +{medal.points} pts
                    </span>
                    {count > 1 && (
                      <span className="text-xs font-semibold text-[#262626] dark:text-white px-2 py-1 rounded bg-[#DDDDDD] dark:bg-[#000000]">
                        x{count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#262626] dark:text-[#DDDDDD] mt-2">
                    {locale === 'ar' ? 'آخر منح:' : 'Last awarded:'}{' '}
                    {new Date(lastAwarded).toLocaleDateString(
                      locale === 'ar' ? 'ar-SA' : 'en-US',
                      { month: 'short', day: 'numeric', year: 'numeric' }
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total Points */}
        <div className="mt-6 p-4 rounded-lg bg-white dark:bg-[#000000] border-2 border-[#FF5F02]">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#262626] dark:text-white">
              {locale === 'ar' ? 'إجمالي النقاط من الميداليات:' : 'Total Medal Points:'}
            </span>
            <span className="text-2xl font-bold text-[#FF5F02]">
              {medals.reduce((sum, sm) => sum + (sm.medal?.points || 0), 0)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
