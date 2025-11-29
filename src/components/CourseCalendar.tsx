'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCourseCalendarAction, getSessionPlanByDateAction } from '@/lib/actions/sessionPlanActions';
import type { SessionPlan } from '@/lib/db/repositories/sessionPlanRepository';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CourseCalendarProps {
  courseId: string;
  locale: 'en' | 'ar';
  dictionary: any;
  onSessionClick?: (session: SessionPlan) => void;
}

interface CalendarDay {
  date: string;
  sessionNumber?: number;
  title?: string;
  titleAr?: string;
  status?: string;
  isCurrentMonth: boolean;
}

export function CourseCalendar({ courseId, locale, dictionary, onSessionClick }: CourseCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<{ date: string; sessionNumber: number; title: string; titleAr: string; status: string }[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SessionPlan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalendar();
  }, [courseId]);

  const loadCalendar = async () => {
    setLoading(true);
    const result = await getCourseCalendarAction(courseId);
    if (result.success && result.calendar) {
      setCalendarData(result.calendar);
    }
    setLoading(false);
  };

  const handleDateClick = async (date: string) => {
    const session = calendarData.find(s => s.date === date);
    if (!session) return;

    const result = await getSessionPlanByDateAction(courseId, date);
    if (result.success && result.plan) {
      if (onSessionClick) {
        onSessionClick(result.plan);
      } else {
        setSelectedPlan(result.plan);
        setDialogOpen(true);
      }
    }
  };

  const getDaysInMonth = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: CalendarDay[] = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const dateStr = new Date(year, month - 1, day).toISOString().split('T')[0];
      days.push({ date: dateStr, isCurrentMonth: false });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(year, month, day).toISOString().split('T')[0];
      const sessionData = calendarData.find(s => s.date === dateStr);
      days.push({
        date: dateStr,
        sessionNumber: sessionData?.sessionNumber,
        title: sessionData?.title,
        titleAr: sessionData?.titleAr,
        status: sessionData?.status,
        isCurrentMonth: true,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const dateStr = new Date(year, month + 1, day).toISOString().split('T')[0];
      days.push({ date: dateStr, isCurrentMonth: false });
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'planned':
      default:
        return 'bg-[#FF5F02]';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in-progress':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'planned':
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = locale === 'ar' 
    ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const monthName = currentDate.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });

  if (loading) {
    return (
      <Card className="bg-white dark:bg-[#262626]">
        <CardContent className="p-8">
          <div className="text-center text-[#262626] dark:text-[#DDDDDD]">
            {dictionary.common?.loading || 'Loading...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white dark:bg-[#262626] border-[#DDDDDD] dark:border-[#262626]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#262626] dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#FF5F02]" />
              {dictionary.courses?.calendar || 'Course Calendar'}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={previousMonth}
                className="h-8 w-8"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-semibold min-w-[150px] text-center">
                {monthName}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={nextMonth}
                className="h-8 w-8"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-[#262626] dark:text-white py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const isToday = day.date === new Date().toISOString().split('T')[0];
              const hasSession = !!day.sessionNumber;

              return (
                <button
                  key={index}
                  onClick={() => hasSession && day.isCurrentMonth && handleDateClick(day.date)}
                  disabled={!hasSession || !day.isCurrentMonth}
                  className={`
                    aspect-square p-2 rounded-lg border-2 transition-all relative
                    ${!day.isCurrentMonth ? 'opacity-30' : ''}
                    ${isToday ? 'border-[#FF5F02] bg-[#FF5F02]/10' : 'border-[#DDDDDD] dark:border-[#262626]'}
                    ${hasSession && day.isCurrentMonth ? 'cursor-pointer hover:border-[#FF5F02] hover:shadow-md' : 'cursor-default'}
                    ${!hasSession ? 'bg-white dark:bg-[#262626]' : 'bg-white dark:bg-[#000000]'}
                  `}
                >
                  <div className="text-sm font-semibold text-[#262626] dark:text-white">
                    {new Date(day.date).getDate()}
                  </div>
                  {hasSession && day.isCurrentMonth && (
                    <>
                      <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${getStatusColor(day.status)}`} />
                      <div className="text-xs text-[#FF5F02] font-bold mt-1">
                        #{day.sessionNumber}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#FF5F02]" />
              <span className="text-[#262626] dark:text-[#DDDDDD]">
                {dictionary.courses?.planned || 'Planned'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-[#262626] dark:text-[#DDDDDD]">
                {dictionary.courses?.inProgress || 'In Progress'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-[#262626] dark:text-[#DDDDDD]">
                {dictionary.courses?.completed || 'Completed'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-[#262626] dark:text-[#DDDDDD]">
                {dictionary.courses?.cancelled || 'Cancelled'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Plan Dialog */}
      {selectedPlan && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-white dark:bg-[#262626]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-bold text-[#262626] dark:text-white">
                  {locale === 'ar' ? selectedPlan.titleAr : selectedPlan.title}
                </DialogTitle>
                <Badge className={`${getStatusColor(selectedPlan.status)} text-white flex items-center gap-1`}>
                  {getStatusIcon(selectedPlan.status)}
                  {selectedPlan.status}
                </Badge>
              </div>
              <DialogDescription className="text-[#262626] dark:text-[#DDDDDD]">
                {dictionary.courses?.session || 'Session'} #{selectedPlan.sessionNumber} • {new Date(selectedPlan.sessionDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'long' })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Description */}
              <div>
                <h4 className="font-semibold text-[#262626] dark:text-white mb-2">
                  {dictionary.courses?.description || 'Description'}
                </h4>
                <p className="text-sm text-[#262626] dark:text-[#DDDDDD]">
                  {locale === 'ar' ? selectedPlan.descriptionAr : selectedPlan.description}
                </p>
              </div>

              {/* Objectives */}
              {selectedPlan.objectives.length > 0 && (
                <div>
                  <h4 className="font-semibold text-[#262626] dark:text-white mb-2">
                    {dictionary.courses?.objectives || 'Objectives'}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-[#262626] dark:text-[#DDDDDD]">
                    {(locale === 'ar' ? selectedPlan.objectivesAr : selectedPlan.objectives).map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Activities */}
              {selectedPlan.activities.length > 0 && (
                <div>
                  <h4 className="font-semibold text-[#262626] dark:text-white mb-2">
                    {dictionary.courses?.activities || 'Activities'}
                  </h4>
                  <div className="space-y-2">
                    {selectedPlan.activities.map((activity) => (
                      <div key={activity.id} className="p-3 rounded-lg border border-[#DDDDDD] dark:border-[#262626] bg-white dark:bg-[#000000]">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-semibold text-[#262626] dark:text-white">
                            {locale === 'ar' ? activity.nameAr : activity.name}
                          </h5>
                          <Badge variant="outline" className="text-xs">
                            {activity.duration} {dictionary.common?.minutes || 'min'}
                          </Badge>
                        </div>
                        {activity.description && (
                          <p className="text-xs text-[#262626] dark:text-[#DDDDDD]">
                            {locale === 'ar' ? activity.descriptionAr : activity.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Materials */}
              {selectedPlan.materials && selectedPlan.materials.length > 0 && (
                <div>
                  <h4 className="font-semibold text-[#262626] dark:text-white mb-2">
                    {dictionary.courses?.materials || 'Required Materials'}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-[#262626] dark:text-[#DDDDDD]">
                    {(locale === 'ar' ? selectedPlan.materialsAr : selectedPlan.materials)?.map((material, idx) => (
                      <li key={idx}>{material}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notes */}
              {selectedPlan.notes && (
                <div>
                  <h4 className="font-semibold text-[#262626] dark:text-white mb-2">
                    {dictionary.courses?.notes || 'Notes'}
                  </h4>
                  <p className="text-sm text-[#262626] dark:text-[#DDDDDD]">
                    {locale === 'ar' ? selectedPlan.notesAr : selectedPlan.notes}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
