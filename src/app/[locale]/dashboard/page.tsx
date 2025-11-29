import { requireAuth } from '@/lib/auth/auth';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { ROLE_LABELS } from '@/config/roles';
import { listUsers, getChildrenByParentId, getUsersByIds } from '@/lib/db/repositories/userRepository';
import { getAllAppointments } from '@/lib/db/repositories/appointmentRepository';
import { getCoursesByCoachId, type Course } from '@/lib/db/repositories/courseRepository';
import { getPaidEnrollmentsByCourseId } from '@/lib/db/repositories/enrollmentRepository';
import { Users, Calendar, Clock, CheckCircle, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChildMedalsPreview } from '@/components/ChildMedalsPreview';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
  const dictionary = await getDictionary(locale);
  const user = await requireAuth(locale);
  const roleLabel = ROLE_LABELS[user.role][locale] || user.role;

  // Fetch children for parent
  let children: any[] = [];
  if (user.role === 'parent') {
    children = await getChildrenByParentId(user.id);
  }

  // Fetch statistics for admin
  let stats = null;
  if (user.role === 'admin') {
    const users = await listUsers();
    const appointments = await getAllAppointments();
    const today = new Date().toISOString().split('T')[0];
    
    stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      totalAppointments: appointments.length,
      pendingAppointments: appointments.filter(a => a.status === 'pending').length,
      todayAppointments: appointments.filter(a => a.appointmentDate === today).length,
    };
  }

  // Fetch courses for coach
  let coachCourses: Array<{ course: Course; activePlayers: number }> = [];
  if (user.role === 'coach') {
    const courses = await getCoursesByCoachId(user.id);

    if (courses.length > 0) {
      coachCourses = await Promise.all(
        courses.map(async (course) => {
          const paidEnrollments = await getPaidEnrollmentsByCourseId(course.id);

          if (paidEnrollments.length === 0) {
            return { course, activePlayers: 0 };
          }

          const studentIds = Array.from(new Set(paidEnrollments.map((enrollment) => enrollment.studentId)));
          const students = await getUsersByIds(studentIds);
          const activeStudentIds = new Set(students.filter((student) => student.isActive).map((student) => student.id));
          const activePlayers = paidEnrollments.filter((enrollment) => activeStudentIds.has(enrollment.studentId)).length;

          return { course, activePlayers };
        })
      );
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[#262626] dark:text-white">
          {dictionary.common.welcome} {user.fullName || user.username}
        </h1>
        <p className="text-lg font-semibold text-[#FF5F02]">
          {dictionary.users.role}: {roleLabel}
        </p>
      </div>

      {/* Statistics Cards for Admin */}
      {user.role === 'admin' && stats && (
        <div className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Users Card */}
            <div className="bg-white dark:bg-[#262626] p-6 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#FF5F02] mb-1">
                    {dictionary.dashboard.totalUsers}
                  </p>
                  <p className="text-4xl font-bold text-[#262626] dark:text-white">
                    {stats.totalUsers}
                  </p>
                </div>
                <div className="bg-[#FF5F02] p-4 rounded-full">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Active Users Card */}
            <div className="bg-white dark:bg-[#262626] p-6 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#FF5F02] mb-1">
                    {dictionary.dashboard.activeUsers}
                  </p>
                  <p className="text-4xl font-bold text-[#262626] dark:text-white">
                    {stats.activeUsers}
                  </p>
                </div>
                <div className="bg-[#FF5F02] p-4 rounded-full">
                  <UserCheck className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Total Appointments Card */}
            <div className="bg-white dark:bg-[#262626] p-6 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#FF5F02] mb-1">
                    {dictionary.dashboard.totalAppointments}
                  </p>
                  <p className="text-4xl font-bold text-[#262626] dark:text-white">
                    {stats.totalAppointments}
                  </p>
                </div>
                <div className="bg-[#FF5F02] p-4 rounded-full">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Pending Appointments card */}
            <div className="bg-white dark:bg-[#262626] p-6 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#FF5F02] mb-1">
                    {dictionary.dashboard.pendingAppointments}
                  </p>
                  <p className="text-4xl font-bold text-[#262626] dark:text-white">
                    {stats.pendingAppointments}
                  </p>
                </div>
                <div className="bg-[#FF5F02] p-4 rounded-full">
                  <Clock className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Today's Appointments Card */}
            <div className="bg-white dark:bg-[#262626] p-6 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#FF5F02] mb-1">
                    {dictionary.dashboard.todayAppointments}
                  </p>
                  <p className="text-4xl font-bold text-[#262626] dark:text-white">
                    {stats.todayAppointments}
                  </p>
                </div>
                <div className="bg-[#FF5F02] p-4 rounded-full">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parent View: List of Children */}
      {user.role === 'parent' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-[#262626] dark:text-white">
            {dictionary.users.children}
          </h2>
          
          {children.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border-2 border-dashed border-gray-300 text-center">
              <p className="text-gray-500 text-lg">{dictionary.users.noChildren}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {children.map((child) => (
                <Link 
                  key={child.id} 
                  href={`/${locale}/dashboard/kids/${child.id}`}
                  className="block group"
                >
                  <div className="bg-white p-6 rounded-xl border-2 border-blue-100 shadow-md hover:shadow-xl hover:border-blue-300 transition-all duration-300">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      {/* Left: Profile Image & Info */}
                      <div className="flex items-center gap-4 flex-1">
                        {/* Profile Image */}
                        <div className="relative shrink-0">
                          {child.profilePicture ? (
                            <img
                              src={child.profilePicture}
                              alt={child.fullName || child.username}
                              className="w-16 h-16 rounded-full object-cover border-4 border-blue-200 group-hover:border-blue-400 transition-colors"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-[#FF5F02] flex items-center justify-center text-white text-2xl font-bold border-4 border-[#FF5F02]/20 group-hover:border-[#FF5F02] transition-colors">
                              {(child.fullName || child.username).charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Name & Info */}
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                            {child.fullName || child.username}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {child.nationalId ? `${dictionary.users.nationalId}: ${child.nationalId}` : child.username}
                          </p>
                        </div>
                      </div>

                      {/* Right: Real Medals */}
                      <div className="shrink-0">
                        <ChildMedalsPreview childId={child.id} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Coach View: Assigned Courses */}
      {user.role === 'coach' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-[#262626] dark:text-white">
              {dictionary.dashboard.coachCourses}
            </h2>
            <p className="text-muted-foreground">
              {dictionary.dashboard.coachCoursesDescription}
            </p>
          </div>

          {coachCourses.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border-2 border-dashed border-gray-300 text-center">
              <p className="text-gray-500 text-lg">
                {dictionary.dashboard.noCoachCourses}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {coachCourses.map(({ course, activePlayers }) => (
                <Link
                  key={course.id}
                  href={`/${locale}/dashboard/coach/courses/${course.id}`}
                  className="group block"
                >
                  <div className="bg-white p-6 rounded-xl border-2 border-blue-100 shadow-md hover:shadow-xl hover:border-blue-300 transition-all duration-300 h-full flex flex-col gap-4">
                    {course.courseImage && (
                      <div className="h-40 w-full rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={course.courseImage}
                          alt={locale === 'ar' ? course.nameAr : course.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {locale === 'ar' ? course.nameAr : course.name}
                        </h3>
                        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${course.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                          {course.isActive ? dictionary.users.active : dictionary.users.inactive}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {course.startDate && (
                          <span>
                            <strong>{dictionary.dashboard.startsOn}:</strong>{' '}
                            {new Date(course.startDate).toLocaleDateString(locale)}
                          </span>
                        )}
                        {course.endDate && (
                          <span>
                            <strong>{dictionary.dashboard.endsOn}:</strong>{' '}
                            {new Date(course.endDate).toLocaleDateString(locale)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">{dictionary.dashboard.activePlayers}</p>
                          <p className="text-2xl font-bold text-[#FF5F02]">{activePlayers}</p>
                        </div>
                        <Button variant="outline" className="border-[#FF5F02] text-[#FF5F02] hover:bg-[#FF5F02] hover:text-white">
                          {dictionary.dashboard.viewRoster}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {user.role === 'admin' && (
        <div className="bg-white dark:bg-[#262626] p-6 rounded-lg border-2 border-[#DDDDDD] dark:border-[#000000] shadow-md">
          <h2 className="text-xl font-bold text-[#262626] dark:text-white mb-4">
            {dictionary.dashboard.quickActions}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href={`/${locale}/dashboard/users`}>
              <Button className="w-full bg-[#262626] hover:bg-[#000000] text-white">
                {dictionary.dashboard.manageUsers}
              </Button>
            </Link>
            <Link href={`/${locale}/dashboard/appointments`}>
              <Button className="w-full bg-[#FF5F02] hover:bg-[#262626] text-white">
                {dictionary.dashboard.viewAppointments}
              </Button>
            </Link>
            <Link href={`/${locale}/dashboard/schedules`}>
              <Button className="w-full bg-[#FF5F02] hover:bg-[#262626] text-white">
                {dictionary.dashboard.manageSchedules}
              </Button>
            </Link>
            <Link href={`/${locale}/dashboard/roles`}>
              <Button className="w-full bg-[#FF5F02] hover:bg-[#262626] text-white">
                {dictionary.dashboard.viewRoles}
              </Button>
            </Link>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
