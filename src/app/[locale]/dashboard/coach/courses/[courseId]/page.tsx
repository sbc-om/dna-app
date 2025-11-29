import { requireAuth } from '@/lib/auth/auth';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { findCourseById } from '@/lib/db/repositories/courseRepository';
import { getPaidEnrollmentsByCourseId } from '@/lib/db/repositories/enrollmentRepository';
import { getUsersByIds } from '@/lib/db/repositories/userRepository';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import CoachAttendanceClient from '@/components/CoachAttendanceClient';

const WEEKDAY_LABELS: Record<string, { en: string; ar: string }> = {
  sunday: { en: 'Sunday', ar: 'الأحد' },
  monday: { en: 'Monday', ar: 'الاثنين' },
  tuesday: { en: 'Tuesday', ar: 'الثلاثاء' },
  wednesday: { en: 'Wednesday', ar: 'الأربعاء' },
  thursday: { en: 'Thursday', ar: 'الخميس' },
  friday: { en: 'Friday', ar: 'الجمعة' },
  saturday: { en: 'Saturday', ar: 'السبت' },
};

function getDayLabel(key: string, locale: Locale) {
  const normalized = key?.toLowerCase?.() ?? key;
  const info = WEEKDAY_LABELS[normalized];
  if (!info) {
    return key;
  }
  return locale === 'ar' ? info.ar : info.en;
}

export default async function CoachCourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; courseId: string }>;
}) {
  const { locale, courseId } = await params as { locale: Locale; courseId: string };
  const dictionary = await getDictionary(locale);
  const user = await requireAuth(locale);

  if (user.role !== 'coach') {
    redirect(`/${locale}/dashboard/forbidden`);
  }

  const course = await findCourseById(courseId);

  if (!course) {
    notFound();
  }

  if (course.coachId !== user.id) {
    redirect(`/${locale}/dashboard/forbidden`);
  }

  const paidEnrollments = await getPaidEnrollmentsByCourseId(courseId);
  const studentIds = Array.from(new Set(paidEnrollments.map((enrollment) => enrollment.studentId)));
  const students = await getUsersByIds(studentIds);
  const activeStudents = students.filter((student) => student.isActive);
  const activeStudentIds = new Set(activeStudents.map((student) => student.id));
  const filteredEnrollments = paidEnrollments.filter((enrollment) => activeStudentIds.has(enrollment.studentId));
  const studentMap = new Map(activeStudents.map((student) => [student.id, student]));

  const roster = filteredEnrollments
    .map((enrollment) => {
      const student = studentMap.get(enrollment.studentId);
      if (!student) {
        return null;
      }
      return { enrollment, student };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort(
      (a, b) =>
        new Date(a.enrollment.enrollmentDate).getTime() -
        new Date(b.enrollment.enrollmentDate).getTime()
    );

  const courseName = locale === 'ar' ? course.nameAr : course.name;
  const courseDescription = locale === 'ar' ? course.descriptionAr : course.description;
  const attendanceRoster = roster.map(({ student }) => ({
    id: student.id,
    name: student.fullName || student.username,
  }));
  const attendanceText = {
    title: dictionary.coachCourse.attendanceSection,
    dateLabel: dictionary.coachCourse.attendanceDate,
    markAllPresent: dictionary.coachCourse.markAllPresent,
    clearAttendance: dictionary.coachCourse.clearAttendance,
    presentLabel: dictionary.coachCourse.presentLabel,
    scoreLabel: dictionary.coachCourse.scoreLabel,
    save: dictionary.coachCourse.saveAttendance,
    saving: dictionary.coachCourse.savingAttendance,
    saved: dictionary.coachCourse.attendanceSaved,
    loading: dictionary.common.loading,
    playerLabel: dictionary.coachCourse.player,
    emptyState: dictionary.coachCourse.noPlayers,
    awardMedal: dictionary.courses?.awardMedal || (locale === 'ar' ? 'منح ميدالية' : 'Award Medal'),
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-5xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{dictionary.coachCourse.title}</p>
          <h1 className="text-3xl font-bold text-[#1E3A8A]">{courseName}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href={`/${locale}/dashboard`}>
              {dictionary.coachCourse.back}
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dictionary.dashboard.overview}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {course.courseImage && (
            <div className="h-64 w-full rounded-xl overflow-hidden bg-gray-100">
              <img
                src={course.courseImage}
                alt={courseName}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          {courseDescription && (
            <p className="text-gray-600 leading-relaxed">{courseDescription}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            {course.startDate && (
              <div>
                <p className="font-semibold text-gray-900">{dictionary.dashboard.startsOn}</p>
                <p>{new Date(course.startDate).toLocaleDateString(locale)}</p>
              </div>
            )}
            {course.endDate && (
              <div>
                <p className="font-semibold text-gray-900">{dictionary.dashboard.endsOn}</p>
                <p>{new Date(course.endDate).toLocaleDateString(locale)}</p>
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{dictionary.users.status}</p>
              <Badge className={course.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                {course.isActive ? dictionary.users.active : dictionary.users.inactive}
              </Badge>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{dictionary.dashboard.activePlayers}</p>
              <p className="text-2xl font-bold text-blue-600">{roster.length}</p>
            </div>
            {course.totalSessions && course.totalSessions > 0 && (
              <div>
                <p className="font-semibold text-gray-900">{locale === 'ar' ? 'إجمالي الجلسات' : 'Total Sessions'}</p>
                <p>{course.totalSessions}</p>
              </div>
            )}
            {course.sessionDays && course.sessionDays.length > 0 && (
              <div>
                <p className="font-semibold text-gray-900">{locale === 'ar' ? 'أيام التدريب' : 'Training Days'}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {course.sessionDays.map((day) => (
                    <span key={day} className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                      {getDayLabel(day, locale)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(course.sessionStartTime || course.sessionEndTime) && (
              <div>
                <p className="font-semibold text-gray-900">{locale === 'ar' ? 'أوقات الجلسات' : 'Session Times'}</p>
                <p>
                  {course.sessionStartTime && (
                    <span>
                      {course.sessionStartTime}
                      {course.sessionEndTime ? ' - ' : ''}
                    </span>
                  )}
                  {course.sessionEndTime}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dictionary.coachCourse.enrolledPlayers}</CardTitle>
        </CardHeader>
        <CardContent>
          {roster.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              {dictionary.coachCourse.noPlayers}
            </div>
          ) : (
            <div className="space-y-4">
              {roster.map(({ enrollment, student }) => (
                <div
                  key={enrollment.id}
                  className="border border-blue-100 rounded-xl p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-2">
                    <Link
                      href={`/${locale}/dashboard/kids/${student.id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {student.fullName || student.username}
                    </Link>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <span>
                        <strong>{dictionary.coachCourse.paymentStatus}:</strong> {dictionary.coachCourse.statusPaid}
                      </span>
                      <span>
                        <strong>{dictionary.coachCourse.enrollmentDate}:</strong>{' '}
                        {new Date(enrollment.enrollmentDate).toLocaleDateString(locale)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                      <Link href={`/${locale}/dashboard/kids/${student.id}`}>
                        {dictionary.coachCourse.viewProfile}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CoachAttendanceClient
        text={attendanceText}
        courseId={course.id}
        roster={attendanceRoster}
        dictionary={dictionary}
        locale={locale}
      />
    </div>
  );
}
