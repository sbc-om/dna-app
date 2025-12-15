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
      <Card className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
        <CardHeader className="bg-gray-50 dark:bg-[#1a1a1a]">
          <CardTitle className="text-[#262626] dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white dark:bg-[#262626]">
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (medals.length === 0) {
    return (
      <Card className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
        <CardHeader className="bg-gray-50 dark:bg-[#1a1a1a]">
          <CardTitle className="text-[#262626] dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            {title}
          </CardTitle>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          )}
        </CardHeader>
        <CardContent className="bg-white dark:bg-[#262626]">
          <div className="text-center py-12 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
            <Award className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">
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
    <Card className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] overflow-hidden">
      <CardHeader className="bg-gray-50 dark:bg-[#1a1a1a]">
        <CardTitle className="text-[#262626] dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        )}
      </CardHeader>
      <CardContent className="bg-white dark:bg-[#262626] pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {uniqueMedals.map(({ medal, count, lastAwarded }) => (
            <div
              key={medal.id}
              className="p-4 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] hover:border-gray-300 dark:hover:border-gray-800 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="text-4xl shrink-0">{medal.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[#262626] dark:text-white truncate">
                    {locale === 'ar' ? medal.nameAr : medal.name}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {locale === 'ar' ? medal.descriptionAr : medal.description}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs font-semibold text-white px-2 py-1 rounded bg-[#262626] dark:bg-white dark:text-black">
                      +{medal.points} pts
                    </span>
                    {count > 1 && (
                      <span className="text-xs font-semibold text-[#262626] dark:text-white px-2 py-1 rounded bg-[#DDDDDD] dark:bg-[#000000]">
                        x{count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
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
        <div className="mt-6 p-5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000]">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#262626] dark:text-white text-lg">
              {locale === 'ar' ? 'إجمالي النقاط من الميداليات:' : 'Total Medal Points:'}
            </span>
            <span className="text-3xl font-bold text-[#262626] dark:text-white flex items-center gap-2">
              <Award className="w-7 h-7 text-gray-700 dark:text-gray-200" />
              {medals.reduce((sum, sm) => sum + (sm.medal?.points || 0), 0)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
