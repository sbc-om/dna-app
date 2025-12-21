'use client';

import type { User } from '@/lib/db/repositories/userRepository';
import type { Course } from '@/lib/db/repositories/courseRepository';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Locale } from '@/config/i18n';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Trophy, Activity, Star, Target, CheckCircle, XCircle, CalendarDays, Sparkles } from 'lucide-react';
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
  kid: User;
  course: Course;
}

export function CourseDetailClient({
  dictionary,
  locale,
  kid,
  course,
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

  const getStatusLabel = (status: string) => {
    if (status === 'in-progress') return dictionary.courses?.inProgress || 'In Progress';
    if (status === 'planned') return dictionary.courses?.planned || 'Planned';
    if (status === 'completed') return dictionary.courses?.completed || 'Completed';
    if (status === 'cancelled') return dictionary.courses?.cancelled || 'Cancelled';
    return status;
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === 'completed') return 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30';
    if (status === 'in-progress') return 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/30';
    if (status === 'cancelled') return 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/30';
    return 'bg-[#FF5F02]/15 text-orange-200 ring-1 ring-[#FF5F02]/30';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
      className="relative min-h-screen overflow-hidden bg-[#05050a]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,95,2,0.15),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(168,85,247,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-linear-to-br from-[#FF5F02]/25 to-purple-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-44 -left-44 h-112 w-md rounded-full bg-linear-to-br from-cyan-500/15 to-purple-500/15 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Course Header */}
        <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40">
          {course.courseImage ? (
            <div className="relative h-44 sm:h-56 w-full overflow-hidden">
              <img
                src={course.courseImage}
                alt={locale === 'ar' ? course.nameAr || course.name : course.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
            </div>
          ) : (
            <div className="relative h-44 sm:h-56 w-full overflow-hidden bg-linear-to-br from-[#FF5F02]/20 via-purple-500/10 to-cyan-500/10">
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
            </div>
          )}

          <CardHeader className="relative">
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, -6, 6, -6, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.5 }}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15"
                  >
                    <Sparkles className="h-5 w-5 text-[#FF5F02]" />
                  </motion.div>
                  <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white line-clamp-1">
                      {locale === 'ar' ? course.nameAr || course.name : course.name}
                    </h1>
                    {(locale === 'ar' ? course.descriptionAr || course.description : course.description) && (
                      <p className="mt-1 text-sm text-white/70 line-clamp-2">
                        {locale === 'ar' ? course.descriptionAr || course.description : course.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  className={
                    course.isActive
                      ? 'rounded-full bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30'
                      : 'rounded-full bg-white/10 text-white/70 ring-1 ring-white/10'
                  }
                >
                  {course.isActive
                    ? dictionary.courses?.active || 'Active'
                    : dictionary.courses?.inactive || 'Inactive'}
                </Badge>
                <Badge className="rounded-full border border-white/15 bg-white/5 text-white/80">
                  {(kid.fullName || kid.username || '').toString()}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative pt-0 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {course.startDate && (
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-black/20">
                  <Calendar className="h-5 w-5 text-[#FF5F02]" />
                  <div>
                    <p className="text-xs text-white/60">{dictionary.courses?.startDate || 'Start Date'}</p>
                    <p className="font-semibold text-white">
                      {new Date(course.startDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}

              {course.endDate && (
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-black/20">
                  <Calendar className="h-5 w-5 text-[#FF5F02]" />
                  <div>
                    <p className="text-xs text-white/60">{dictionary.courses?.endDate || 'End Date'}</p>
                    <p className="font-semibold text-white">
                      {new Date(course.endDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
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

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-white/5 border border-white/10 p-1 lg:w-[720px]">
            <TabsTrigger
              value="overview"
              className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              <Activity className="h-4 w-4 me-2" />
              {dictionary.courses?.overview || dictionary.courses?.basicInformation || 'Overview'}
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              <CalendarDays className="h-4 w-4 me-2" />
              {dictionary.courses?.calendar || dictionary.courses?.schedule || 'Schedule'}
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              <Trophy className="h-4 w-4 me-2" />
              {dictionary.courses?.achievements || 'Achievements'}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[{
                key: 'sessions',
                value: totalSessions,
                label: dictionary.courses?.sessions || 'Sessions',
                icon: Activity,
              }, {
                key: 'present',
                value: presentCount,
                label: dictionary.courses?.present || 'Present',
                icon: CheckCircle,
              }, {
                key: 'attendance',
                value: `${attendanceRate}%`,
                label: dictionary.playerProfile?.labels?.attendance || 'Attendance',
                icon: Target,
              }, {
                key: 'avg',
                value: `${averageScore}/10`,
                label: dictionary.courses?.avgScore || 'Avg Score',
                icon: Star,
              }].map(({ key, value, label, icon: Icon }, idx) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.03, rotate: 0.25 }}
                >
                  <Card className="rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/25">
                    <CardContent className="p-4 text-center">
                      <Icon className="h-8 w-8 mx-auto mb-2 text-[#FF5F02]" />
                      <p className="text-2xl font-bold text-white">{value}</p>
                      <p className="text-xs text-white/60">{label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card className="rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/25">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#FF5F02]" />
                  <CardTitle className="text-lg text-white">
                    {dictionary.courses?.attendanceHistory || 'Attendance History'}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {loadingAttendance ? (
                  <div className="text-center py-8 text-white/60">{dictionary.common?.loading || 'Loading...'}</div>
                ) : attendanceRecords.length === 0 ? (
                  <div className="text-center py-12 text-white/60">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-white/20" />
                    <p className="text-lg font-medium mb-2 text-white">{dictionary.courses?.noAttendanceTitle || 'No attendance records yet'}</p>
                    <p className="text-sm">{dictionary.courses?.noAttendanceDescription || ''}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attendanceRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-white/10 bg-black/20"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10">
                            {record.present ? (
                              <CheckCircle className="h-6 w-6 text-emerald-400" />
                            ) : (
                              <XCircle className="h-6 w-6 text-rose-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {new Date(record.sessionDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                weekday: 'long',
                              })}
                            </p>
                            <p className="text-sm text-white/60">
                              {record.present ? (dictionary.courses?.present || 'Present') : (dictionary.courses?.absent || 'Absent')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {record.score ? (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                              <Star className="h-5 w-5 text-yellow-400" />
                              <span className="font-bold text-yellow-200">{record.score}/10</span>
                            </div>
                          ) : null}
                          {record.notes ? (
                            <p className="text-sm text-white/60 italic max-w-xs line-clamp-2">“{record.notes}”</p>
                          ) : null}
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
            <Card className="rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/25">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-[#FF5F02]" />
                  <CardTitle className="text-lg text-white">{dictionary.courses?.courseCalendar || 'Course Calendar'}</CardTitle>
                </div>
                <p className="text-sm text-white/60 mt-2">{dictionary.courses?.viewAllSessions || ''}</p>
              </CardHeader>
              <CardContent className="pt-6">
                {loadingSessions ? (
                  <div className="text-center py-12 text-white/60">{dictionary.courses?.loadingCalendar || dictionary.common?.loading || 'Loading...'}</div>
                ) : sessionPlans.length === 0 ? (
                  <div className="text-center py-12 text-white/60">
                    <CalendarDays className="h-16 w-16 mx-auto mb-4 text-white/20" />
                    <p className="text-lg font-medium mb-2 text-white">{dictionary.courses?.noSessionsScheduled || 'No sessions scheduled'}</p>
                    <p className="text-sm">{dictionary.courses?.noTrainingSessionsPlanned || ''}</p>
                  </div>
                ) : (
                  <CourseCalendar courseId={course.id} locale={locale} dictionary={dictionary} />
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/25">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#FF5F02]" />
                  <CardTitle className="text-lg text-white">{dictionary.courses?.sessionsList || 'Sessions List'}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {sessionPlans.length === 0 ? (
                  <div className="text-center py-8 text-white/60">{dictionary.courses?.noSessionsScheduled || 'No sessions scheduled'}</div>
                ) : (
                  <div className="space-y-3">
                    {sessionPlans.map((session) => (
                      <div
                        key={session.id}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-white/10 bg-black/20"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10">
                            <span className="font-bold text-[#FF5F02]">{session.sessionNumber}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {locale === 'ar'
                                ? session.titleAr || session.title || `${dictionary.courses?.sessionNumber || 'Session #'}${session.sessionNumber}`
                                : session.title || `${dictionary.courses?.sessionNumber || 'Session #'}${session.sessionNumber}`}
                            </p>
                            <p className="text-sm text-white/60">
                              {new Date(session.sessionDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                            {session.description ? (
                              <p className="text-xs text-white/50 mt-1 line-clamp-1">
                                {locale === 'ar' ? session.descriptionAr || session.description : session.description}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={`rounded-full ${getStatusBadgeClass(session.status)}`}>{getStatusLabel(session.status)}</Badge>
                          {session.activities?.length ? (
                            <Badge variant="outline" className="rounded-full border-white/15 bg-white/5 text-white/80">
                              {session.activities.length} {dictionary.courses?.activitiesCount || 'activities'}
                            </Badge>
                          ) : null}
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
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/25">
              <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-[#FF5F02]/12 via-purple-500/10 to-cyan-500/10" />
              <div className="relative flex items-start gap-3">
                <motion.div
                  animate={{ rotate: [0, -5, 5, -5, 0] }}
                  transition={{ duration: 0.7 }}
                  className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15"
                >
                  <Trophy className="h-5 w-5 text-[#FF5F02]" />
                </motion.div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-white">
                    {dictionary.playerProfile?.achievements?.bilingualTitle || dictionary.courses?.achievements || 'Achievements'}
                  </h3>
                  <p className="mt-1 text-sm text-white/60">
                    {dictionary.playerProfile?.achievements?.bilingualSubtitle || ''}
                  </p>
                </div>
              </div>
            </div>

            <StudentMedalsDisplay
              studentId={kid.id}
              courseId={course.id}
              hideHeader
              locale={locale}
              onTotalPointsChange={setTotalMedalPoints}
            />

            <Card className="rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/25">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-[#FF5F02]" />
                  <CardTitle className="text-lg text-white">{dictionary.courses?.totalPoints || 'Total Points'}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-linear-to-br from-[#FF5F02] to-orange-600 border border-white/15 shadow-2xl shadow-orange-500/20 mb-4">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-white">{totalMedalPoints}</p>
                      <p className="text-xs text-white/80 font-medium mt-1">{dictionary.courses?.points || 'pts'}</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/70 mt-4 font-medium">
                    {(dictionary.courses?.pointsSummary || 'Total from {scoredSessions} scored sessions')
                      .replace('{scoredSessions}', String(attendanceRecords.filter((r) => r.score).length))}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/25">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#FF5F02]" />
                  <CardTitle className="text-lg text-white">{dictionary.courses?.achievementStats || 'Achievement Stats'}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[{
                    key: 'sessions',
                    value: totalSessions,
                    label: dictionary.courses?.sessions || 'Sessions',
                  }, {
                    key: 'present',
                    value: presentCount,
                    label: dictionary.courses?.present || 'Present',
                  }, {
                    key: 'avg',
                    value: averageScore,
                    label: dictionary.courses?.avgScore || 'Avg Score',
                  }, {
                    key: 'rate',
                    value: `${attendanceRate}%`,
                    label: dictionary.playerProfile?.labels?.attendance || 'Attendance',
                  }].map((item) => (
                    <div
                      key={item.key}
                      className="text-center p-4 bg-black/20 rounded-2xl border border-white/10"
                    >
                      <p className="text-2xl font-bold text-[#FF5F02]">{item.value}</p>
                      <p className="text-xs text-white/70">{item.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-2xl border border-white/10">
                    <span className="text-sm font-medium text-white">{dictionary.courses?.totalAttendancePoints || 'Total Attendance Points'}</span>
                    <span className="text-lg font-bold text-[#FF5F02]">
                      {attendanceRecords.reduce((sum, r) => sum + (r.score || 0), 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-2xl border border-white/10">
                    <span className="text-sm font-medium text-white">{dictionary.courses?.totalMedalPoints || 'Total Medal Points'}</span>
                    <span className="text-lg font-bold text-[#FF5F02]">{totalMedalPoints}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-linear-to-r from-[#FF5F02] to-orange-600 rounded-2xl shadow-2xl shadow-orange-500/20">
                    <span className="text-sm font-bold text-white">{dictionary.courses?.grandTotal || 'Grand Total'}</span>
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
    </motion.div>
  );
}
