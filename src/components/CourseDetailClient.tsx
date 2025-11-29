'use client';

import { User } from '@/lib/db/repositories/userRepository';
import { Course } from '@/lib/db/repositories/courseRepository';
import { AuthUser } from '@/lib/auth/auth';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, Trophy, Activity, Star, Medal, Target, CheckCircle, XCircle, CalendarDays } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getStudentCourseAttendanceAction } from '@/lib/actions/attendanceActions';
import { getSessionPlansAction } from '@/lib/actions/sessionPlanActions';
import type { AttendanceRecord } from '@/lib/db/repositories/attendanceRepository';
import type { SessionPlan } from '@/lib/db/repositories/sessionPlanRepository';
import { StudentMedalsDisplay } from '@/components/StudentMedalsDisplay';
import { CourseCalendar } from '@/components/CourseCalendar';

interface CourseDetailClientProps {
  dictionary: Dictionary;
  locale: Locale;
  kid: User | any;
  course: Course;
  currentUser: AuthUser | any;
}

export function CourseDetailClient({
  dictionary,
  locale,
  kid,
  course,
  currentUser,
}: CourseDetailClientProps) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [totalMedalPoints, setTotalMedalPoints] = useState(0);
  const [sessionPlans, setSessionPlans] = useState<SessionPlan[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    async function loadAttendance() {
      try {
        const result = await getStudentCourseAttendanceAction(kid.id, course.id);
        if (result.success && result.records) {
          setAttendanceRecords(result.records);
        }
      } catch (error) {
        console.error('Failed to load attendance:', error);
      } finally {
        setLoadingAttendance(false);
      }
    }
    loadAttendance();
  }, [kid.id, course.id]);

  useEffect(() => {
    async function loadSessionPlans() {
      try {
        const result = await getSessionPlansAction(course.id);
        if (result.success && result.plans) {
          setSessionPlans(result.plans);
        }
      } catch (error) {
        console.error('Failed to load session plans:', error);
      } finally {
        setLoadingSessions(false);
      }
    }
    loadSessionPlans();
  }, [course.id]);

  // Calculate stats
  const totalSessions = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(r => r.present).length;
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
  const averageScore = attendanceRecords.filter(r => r.score).length > 0
    ? Math.round(attendanceRecords.reduce((sum, r) => sum + (r.score || 0), 0) / attendanceRecords.filter(r => r.score).length)
    : 0;

  return (
    <div className="min-h-screen bg-[#DDDDDD] dark:bg-[#000000]">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 me-2" />
          {locale === 'ar' ? 'رجوع' : 'Back'}
        </Button>
      </div>

        {/* Course Header Card */}
        <Card className="shadow-lg border-2 border-[#DDDDDD] dark:border-[#262626] bg-white dark:bg-[#262626]">
          <CardHeader className="bg-white dark:bg-[#262626] border-b border-[#DDDDDD] dark:border-[#262626]">
            <div>
                <h1 className="text-3xl font-bold text-[#262626] dark:text-white mb-2">
                    {locale === 'ar' ? course.nameAr : course.name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {locale === 'ar' ? course.descriptionAr : course.description}
                </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-[#FF5F02] text-white">
                      {locale === 'ar' ? 'نشط' : 'Active'}
                    </Badge>
                  <Badge variant="outline">
                    {locale === 'ar' ? 'الطالب:' : 'Student:'} {kid.fullName || kid.username}
                  </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Course Duration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.startDate && (
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#262626] border border-[#DDDDDD] dark:border-[#262626] rounded-lg">
                      <Calendar className="h-5 w-5 text-[#FF5F02]" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {locale === 'ar' ? 'تاريخ البدء' : 'Start Date'}
                        </p>
                        <p className="font-semibold text-[#262626] dark:text-white">
                          {new Date(course.startDate).toLocaleDateString(locale, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  {course.endDate && (
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#262626] border border-[#DDDDDD] dark:border-[#262626] rounded-lg">
                      <Calendar className="h-5 w-5 text-[#FF5F02]" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {locale === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}
                        </p>
                        <p className="font-semibold text-[#262626] dark:text-white">
                          {new Date(course.endDate).toLocaleDateString(locale, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

      {/* Tabs for Overview, Schedule and Achievements */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 me-2" />
            {locale === 'ar' ? 'النظرة العامة' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <CalendarDays className="h-4 w-4 me-2" />
            {locale === 'ar' ? 'التقويم' : 'Schedule'}
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Trophy className="h-4 w-4 me-2" />
            {locale === 'ar' ? 'الإنجازات' : 'Achievements'}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#262626]">
              <CardContent className="p-4 text-center">
                <Activity className="h-8 w-8 mx-auto mb-2 text-[#FF5F02]" />
                <p className="text-2xl font-bold text-[#262626] dark:text-white">{totalSessions}</p>
                <p className="text-sm text-[#262626] dark:text-white">
                  {locale === 'ar' ? 'جلسات' : 'Sessions'}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#262626]">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-[#FF5F02]" />
                <p className="text-2xl font-bold text-[#262626] dark:text-white">{presentCount}</p>
                <p className="text-sm text-[#262626] dark:text-white">
                  {locale === 'ar' ? 'حضور' : 'Present'}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#262626]">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-[#FF5F02]" />
                <p className="text-2xl font-bold text-[#262626] dark:text-white">{attendanceRate}%</p>
                <p className="text-sm text-[#262626] dark:text-white">
                  {locale === 'ar' ? 'نسبة الحضور' : 'Attendance'}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#262626]">
              <CardContent className="p-4 text-center">
                <Star className="h-8 w-8 mx-auto mb-2 text-[#FF5F02]" />
                <p className="text-2xl font-bold text-[#262626] dark:text-white">{averageScore}/10</p>
                <p className="text-sm text-[#262626] dark:text-white">
                  {locale === 'ar' ? 'متوسط النقاط' : 'Avg Score'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Attendance History */}
          <Card className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#262626]">
            <CardHeader className="bg-white dark:bg-[#262626] border-b border-[#DDDDDD] dark:border-[#262626]">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#FF5F02]" />
                <CardTitle className="text-lg text-[#262626] dark:text-white">
                  {locale === 'ar' ? 'سجل الحضور' : 'Attendance History'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAttendance ? (
                <div className="text-center py-8 text-gray-500">
                  {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </div>
              ) : attendanceRecords.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">
                    {locale === 'ar' ? 'لا توجد سجلات حضور بعد' : 'No attendance records yet'}
                  </p>
                  <p className="text-sm">
                    {locale === 'ar' 
                      ? 'سيتم عرض سجلات الحضور هنا بعد بدء الجلسات' 
                      : 'Attendance records will appear here after sessions start'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attendanceRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4 mb-3 md:mb-0">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
                          {record.present ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : (
                            <XCircle className="h-6 w-6 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {new Date(record.sessionDate).toLocaleDateString(locale, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              weekday: 'long',
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {record.present 
                              ? (locale === 'ar' ? 'حاضر' : 'Present')
                              : (locale === 'ar' ? 'غائب' : 'Absent')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {record.score && (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-50">
                            <Star className="h-5 w-5 text-yellow-600" />
                            <span className="font-bold text-yellow-900">{record.score}/10</span>
                          </div>
                        )}
                        {record.notes && (
                          <p className="text-sm text-gray-600 italic max-w-xs">"{record.notes}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4 mt-4">
          {/* Course Calendar */}
          <Card className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#262626]">
            <CardHeader className="bg-white dark:bg-[#262626] border-b border-[#DDDDDD] dark:border-[#262626]">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-[#FF5F02]" />
                <CardTitle className="text-lg text-[#262626] dark:text-white">
                  {locale === 'ar' ? 'تقويم الدورة' : 'Course Calendar'}
                </CardTitle>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {locale === 'ar' 
                  ? 'عرض جميع جلسات التدريب المجدولة للدورة'
                  : 'View all scheduled training sessions for the course'}
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              {loadingSessions ? (
                <div className="text-center py-12 text-gray-500">
                  {locale === 'ar' ? 'جاري التحميل...' : 'Loading calendar...'}
                </div>
              ) : sessionPlans.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CalendarDays className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">
                    {locale === 'ar' ? 'لا توجد جلسات مجدولة' : 'No sessions scheduled'}
                  </p>
                  <p className="text-sm">
                    {locale === 'ar' 
                      ? 'لم يتم تخطيط أي جلسات تدريب بعد'
                      : 'No training sessions have been planned yet'}
                  </p>
                </div>
              ) : (
                <CourseCalendar
                  courseId={course.id}
                  locale={locale}
                  dictionary={dictionary}
                />
              )}
            </CardContent>
          </Card>

          {/* Sessions List */}
          <Card className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#262626]">
            <CardHeader className="bg-white dark:bg-[#262626] border-b border-[#DDDDDD] dark:border-[#262626]">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#FF5F02]" />
                <CardTitle className="text-lg text-[#262626] dark:text-white">
                  {locale === 'ar' ? 'قائمة الجلسات' : 'Sessions List'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {sessionPlans.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {locale === 'ar' ? 'لا توجد جلسات' : 'No sessions available'}
                </div>
              ) : (
                <div className="space-y-3">
                  {sessionPlans.map((session) => (
                    <div
                      key={session.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border-2 border-[#DDDDDD] dark:border-[#262626] bg-white dark:bg-[#000000] hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4 mb-3 md:mb-0">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#FF5F02]/10 border-2 border-[#FF5F02]">
                          <span className="font-bold text-[#FF5F02]">
                            {session.sessionNumber}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-[#262626] dark:text-white">
                            {locale === 'ar' 
                              ? session.titleAr || session.title || `الجلسة ${session.sessionNumber}`
                              : session.title || `Session ${session.sessionNumber}`}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(session.sessionDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          {session.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-1">
                              {locale === 'ar' ? session.descriptionAr || session.description : session.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={`
                          ${session.status === 'completed' ? 'bg-green-500 hover:bg-green-600' : ''}
                          ${session.status === 'in-progress' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                          ${session.status === 'cancelled' ? 'bg-red-500 hover:bg-red-600' : ''}
                          ${session.status === 'planned' ? 'bg-[#FF5F02] hover:bg-[#FF5F02]/90' : ''}
                          text-white
                        `}>
                          {locale === 'ar' 
                            ? (session.status === 'completed' ? 'مكتمل' : 
                               session.status === 'in-progress' ? 'جاري' :
                               session.status === 'cancelled' ? 'ملغي' : 'مخطط')
                            : (session.status === 'completed' ? 'Completed' :
                               session.status === 'in-progress' ? 'In Progress' :
                               session.status === 'cancelled' ? 'Cancelled' : 'Planned')}
                        </Badge>
                        {session.activities && session.activities.length > 0 && (
                          <Badge variant="outline" className="border-[#FF5F02] text-[#FF5F02]">
                            {session.activities.length} {dictionary.courses?.activitiesCount || (locale === 'ar' ? 'نشاط' : 'activities')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4 mt-4">
          {/* Medals Display */}
          <StudentMedalsDisplay
            studentId={kid.id}
            courseId={course.id}
            title={locale === 'ar' ? 'الميداليات' : 'Medals'}
            description={locale === 'ar' ? 'الميداليات التي حصل عليها الطالب في هذه الدورة' : 'Medals earned by the student in this course'}
            locale={locale}
            onTotalPointsChange={setTotalMedalPoints}
          />

          {/* Points Card */}
          <Card className="bg-white dark:bg-[#262626] border-[#DDDDDD] dark:border-[#262626]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-[#FF5F02]" />
                <CardTitle className="text-lg text-[#262626] dark:text-white">
                  {locale === 'ar' ? 'مجموع النقاط' : 'Total Points'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-[#FF5F02] to-orange-600 border-4 border-orange-300 shadow-lg mb-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-white">{totalMedalPoints}</p>
                    <p className="text-xs text-white/80 font-medium mt-1">
                      {locale === 'ar' ? 'نقطة' : 'Points'}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[#262626] dark:text-[#DDDDDD] mt-4 font-medium">
                  {locale === 'ar' 
                    ? `مجموع النقاط من ${attendanceRecords.filter(r => r.score).length} جلسة و ${totalMedalPoints > 0 ? 'الميداليات' : 'لا توجد ميداليات'}` 
                    : `Total from ${attendanceRecords.filter(r => r.score).length} sessions and ${totalMedalPoints > 0 ? 'medals' : 'no medals'}`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Achievements Stats */}
          <Card className="bg-white dark:bg-[#262626] border-[#DDDDDD] dark:border-[#262626]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[#FF5F02]" />
                <CardTitle className="text-lg text-[#262626] dark:text-white">
                  {locale === 'ar' ? 'إحصائيات الإنجازات' : 'Achievement Stats'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white dark:bg-[#000000] rounded-lg border-2 border-[#DDDDDD] dark:border-[#262626]">
                  <p className="text-2xl font-bold text-[#FF5F02]">{totalSessions}</p>
                  <p className="text-sm text-[#262626] dark:text-[#DDDDDD]">
                    {locale === 'ar' ? 'جلسات' : 'Sessions'}
                  </p>
                </div>
                <div className="text-center p-4 bg-white dark:bg-[#000000] rounded-lg border-2 border-[#DDDDDD] dark:border-[#262626]">
                  <p className="text-2xl font-bold text-[#FF5F02]">{presentCount}</p>
                  <p className="text-sm text-[#262626] dark:text-[#DDDDDD]">
                    {locale === 'ar' ? 'حضور' : 'Present'}
                  </p>
                </div>
                <div className="text-center p-4 bg-white dark:bg-[#000000] rounded-lg border-2 border-[#DDDDDD] dark:border-[#262626]">
                  <p className="text-2xl font-bold text-[#FF5F02]">{averageScore}</p>
                  <p className="text-sm text-[#262626] dark:text-[#DDDDDD]">
                    {locale === 'ar' ? 'متوسط النقاط' : 'Avg Score'}
                  </p>
                </div>
                <div className="text-center p-4 bg-white dark:bg-[#000000] rounded-lg border-2 border-[#DDDDDD] dark:border-[#262626]">
                  <p className="text-2xl font-bold text-[#FF5F02]">{attendanceRate}%</p>
                  <p className="text-sm text-[#262626] dark:text-[#DDDDDD]">
                    {locale === 'ar' ? 'معدل الحضور' : 'Attendance'}
                  </p>
                </div>
              </div>
              
              {/* Additional Info */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-[#000000] rounded-lg border border-[#DDDDDD] dark:border-[#262626]">
                  <span className="text-sm font-medium text-[#262626] dark:text-white">
                    {locale === 'ar' ? 'إجمالي نقاط الحضور:' : 'Total Attendance Points:'}
                  </span>
                  <span className="text-lg font-bold text-[#FF5F02]">
                    {attendanceRecords.reduce((sum, r) => sum + (r.score || 0), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-[#000000] rounded-lg border border-[#DDDDDD] dark:border-[#262626]">
                  <span className="text-sm font-medium text-[#262626] dark:text-white">
                    {locale === 'ar' ? 'إجمالي نقاط الميداليات:' : 'Total Medal Points:'}
                  </span>
                  <span className="text-lg font-bold text-[#FF5F02]">
                    {totalMedalPoints}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#FF5F02] to-orange-600 rounded-lg shadow-md">
                  <span className="text-sm font-bold text-white">
                    {locale === 'ar' ? '🏆 المجموع الكلي:' : '🏆 Grand Total:'}
                  </span>
                  <span className="text-2xl font-bold text-white">
                    {attendanceRecords.reduce((sum, r) => sum + (r.score || 0), 0) + totalMedalPoints}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
