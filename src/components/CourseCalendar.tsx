'use client';

import { useCallback, useEffect, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCourseCalendarAction, getSessionPlanByDateAction } from '@/lib/actions/sessionPlanActions';
import type { SessionPlan } from '@/lib/db/repositories/sessionPlanRepository';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Locale } from '@/config/i18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CourseCalendarProps {
  courseId: string;
  locale: Locale;
  dictionary: Dictionary;
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

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    const result = await getCourseCalendarAction(courseId);
    if (result.success && result.calendar) {
      setCalendarData(result.calendar);
    }
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCalendar();
  }, [loadCalendar]);

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
  const weekDays = [
    dictionary.courses?.weekdaysShort?.sunday || dictionary.courses?.sunday || 'Sun',
    dictionary.courses?.weekdaysShort?.monday || dictionary.courses?.monday || 'Mon',
    dictionary.courses?.weekdaysShort?.tuesday || dictionary.courses?.tuesday || 'Tue',
    dictionary.courses?.weekdaysShort?.wednesday || dictionary.courses?.wednesday || 'Wed',
    dictionary.courses?.weekdaysShort?.thursday || dictionary.courses?.thursday || 'Thu',
    dictionary.courses?.weekdaysShort?.friday || dictionary.courses?.friday || 'Fri',
    dictionary.courses?.weekdaysShort?.saturday || dictionary.courses?.saturday || 'Sat',
  ];

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
        <CardHeader className="px-3 sm:px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base sm:text-lg text-[#262626] dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF5F02] shrink-0" />
              <span className="truncate">{dictionary.courses?.calendar || 'Course Calendar'}</span>
            </CardTitle>
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={previousMonth}
                className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 active:scale-95 transition-transform touch-manipulation"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <span className="text-xs sm:text-sm font-semibold min-w-[120px] sm:min-w-[150px] text-center px-2">
                {monthName}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={nextMonth}
                className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 active:scale-95 transition-transform touch-manipulation"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-4 md:px-6">
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-[10px] sm:text-xs md:text-sm font-semibold text-[#262626] dark:text-white py-1 sm:py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {days.map((day, index) => {
              const isToday = day.date === new Date().toISOString().split('T')[0];
              const hasSession = !!day.sessionNumber;

              return (
                <button
                  key={index}
                  onClick={() => hasSession && day.isCurrentMonth && handleDateClick(day.date)}
                  disabled={!hasSession || !day.isCurrentMonth}
                  className={`
                    aspect-square p-1 sm:p-2 rounded-md sm:rounded-lg border sm:border-2 transition-all relative touch-manipulation active:scale-95
                    ${!day.isCurrentMonth ? 'opacity-30' : ''}
                    ${isToday ? 'border-[#FF5F02] bg-[#FF5F02]/10' : 'border-[#DDDDDD] dark:border-[#262626]'}
                    ${hasSession && day.isCurrentMonth ? 'cursor-pointer hover:border-[#FF5F02] hover:shadow-md' : 'cursor-default'}
                    ${!hasSession ? 'bg-white dark:bg-[#262626]' : 'bg-white dark:bg-[#000000]'}
                  `}
                >
                  <div className="text-[10px] sm:text-xs md:text-sm font-semibold text-[#262626] dark:text-white">
                    {new Date(day.date).getDate()}
                  </div>
                  {hasSession && day.isCurrentMonth && (
                    <>
                      <div className={`absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${getStatusColor(day.status)}`} />
                      <div className="text-[8px] sm:text-[10px] md:text-xs text-[#FF5F02] font-bold mt-0.5 sm:mt-1">
                        #{day.sessionNumber}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-3 text-[10px] sm:text-xs">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#FF5F02] shrink-0" />
              <span className="text-[#262626] dark:text-[#DDDDDD]">
                {dictionary.courses?.planned || 'Planned'}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500 shrink-0" />
              <span className="text-[#262626] dark:text-[#DDDDDD]">
                {dictionary.courses?.inProgress || 'In Progress'}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500 shrink-0" />
              <span className="text-[#262626] dark:text-[#DDDDDD]">
                {dictionary.courses?.completed || 'Completed'}
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500 shrink-0" />
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
          <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto bg-white dark:bg-[#262626] p-4 sm:p-6">
            <DialogHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-[#262626] dark:text-white pr-8 sm:pr-0">
                  {locale === 'ar' ? selectedPlan.titleAr : selectedPlan.title}
                </DialogTitle>
                <Badge className={`${getStatusColor(selectedPlan.status)} text-white flex items-center gap-1 self-start sm:self-auto shrink-0`}>
                  {getStatusIcon(selectedPlan.status)}
                  <span className="text-xs sm:text-sm">{selectedPlan.status}</span>
                </Badge>
              </div>
              <DialogDescription className="text-sm sm:text-base text-[#262626] dark:text-[#DDDDDD]">
                {dictionary.courses?.session || 'Session'} #{selectedPlan.sessionNumber} • {new Date(selectedPlan.sessionDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'long' })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
              {/* Description */}
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-[#262626] dark:text-white mb-2">
                  {dictionary.courses?.description || 'Description'}
                </h4>
                <p className="text-xs sm:text-sm text-[#262626] dark:text-[#DDDDDD]">
                  {locale === 'ar' ? selectedPlan.descriptionAr : selectedPlan.description}
                </p>
              </div>

              {/* Objectives */}
              {selectedPlan.objectives.length > 0 && (
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-[#262626] dark:text-white mb-2">
                    {dictionary.courses?.objectives || 'Objectives'}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-[#262626] dark:text-[#DDDDDD]">
                    {(locale === 'ar' ? selectedPlan.objectivesAr : selectedPlan.objectives).map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Activities */}
              {selectedPlan.activities.length > 0 && (
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-[#262626] dark:text-white mb-2">
                    {dictionary.courses?.activities || 'Activities'}
                  </h4>
                  <div className="space-y-2">
                    {selectedPlan.activities.map((activity) => (
                      <div key={activity.id} className="p-2 sm:p-3 rounded-lg border border-[#DDDDDD] dark:border-[#262626] bg-white dark:bg-[#000000]">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-1">
                          <h5 className="text-sm sm:text-base font-semibold text-[#262626] dark:text-white">
                            {locale === 'ar' ? activity.nameAr : activity.name}
                          </h5>
                          <Badge variant="outline" className="text-xs self-start sm:self-auto shrink-0">
                            {activity.duration} {dictionary.common?.minutes || 'min'}
                          </Badge>
                        </div>
                        {activity.description && (
                          <p className="text-xs sm:text-sm text-[#262626] dark:text-[#DDDDDD]">
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
                  <h4 className="text-sm sm:text-base font-semibold text-[#262626] dark:text-white mb-2">
                    {dictionary.courses?.materials || 'Required Materials'}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-[#262626] dark:text-[#DDDDDD]">
                    {(locale === 'ar' ? selectedPlan.materialsAr : selectedPlan.materials)?.map((material, idx) => (
                      <li key={idx}>{material}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notes */}
              {selectedPlan.notes && (
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-[#262626] dark:text-white mb-2">
                    {dictionary.courses?.notes || 'Notes'}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#262626] dark:text-[#DDDDDD]">
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
