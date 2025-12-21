'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle,
  UserCircle,
  Star,
  Plus,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { StudentAttendanceDialog } from './StudentAttendanceDialog';
import { getCourseAttendanceAction } from '@/lib/actions/attendanceActions';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Locale } from '@/config/i18n';

interface Student {
  id: string;
  fullName?: string;
  username?: string;
  profilePicture?: string;
  nationalId?: string;
}

interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  enrollmentDate: string;
  paymentStatus: string;
}

interface RosterEntry {
  student: Student;
  enrollment: Enrollment;
}

interface Course {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  courseImage?: string;
  totalSessions?: number;
  sessionDays?: string[];
  sessionStartTime?: string;
  sessionEndTime?: string;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  present: boolean;
  score?: number;
  notes?: string;
}

interface CoachCourseDetailClientProps {
  course: Course;
  roster: RosterEntry[];
  dictionary: Dictionary;
  locale: Locale;
}

export function CoachCourseDetailClient({
  course,
  roster,
  dictionary,
  locale,
}: CoachCourseDetailClientProps) {
  const today = new Date().toISOString().split('T')[0];
  const [sessionDate, setSessionDate] = useState<string>(today);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Load attendance for selected date
  useEffect(() => {
    async function loadAttendance() {
      setLoading(true);
      try {
        const result = await getCourseAttendanceAction(course.id, sessionDate);
        if (result.success && result.records) {
          setAttendanceRecords(result.records);
        }
      } catch (error) {
        console.error('Failed to load attendance:', error);
      } finally {
        setLoading(false);
      }
    }
    loadAttendance();
  }, [course.id, sessionDate]);

  const openStudentDialog = (student: Student) => {
    setSelectedStudent(student);
    setDialogOpen(true);
  };

  const handleAttendanceSaved = () => {
    // Reload attendance after save
    getCourseAttendanceAction(course.id, sessionDate).then(result => {
      if (result.success && result.records) {
        setAttendanceRecords(result.records);
      }
    });
  };

  // Get student attendance status
  const getStudentStatus = (studentId: string) => {
    return attendanceRecords.find(r => r.studentId === studentId);
  };

  // Calculate stats
  const totalStudents = roster.length;
  const presentCount = attendanceRecords.filter(r => r.present).length;
  const absentCount = totalStudents - presentCount;
  const avgScore = attendanceRecords.filter(r => r.score).length > 0
    ? Math.round(attendanceRecords.reduce((sum, r) => sum + (r.score || 0), 0) / attendanceRecords.filter(r => r.score).length)
    : 0;

  const courseName = locale === 'ar' ? (course.nameAr || course.name) : course.name;
  const courseDescription = locale === 'ar' ? (course.descriptionAr || course.description) : course.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
      className="relative min-h-screen overflow-hidden bg-[#05050a]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,95,2,0.15),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-linear-to-br from-[#FF5F02]/25 to-purple-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-44 -left-44 h-112 w-md rounded-full bg-linear-to-br from-cyan-500/15 to-blue-500/15 blur-3xl" />

      <div className="relative max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40">
          {course.courseImage ? (
            <div className="relative h-40 sm:h-52 w-full overflow-hidden">
              <img src={course.courseImage} alt={courseName} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
            </div>
          ) : (
            <div className="relative h-40 sm:h-52 w-full overflow-hidden bg-linear-to-br from-[#FF5F02]/20 via-purple-500/10 to-cyan-500/10">
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
            </div>
          )}

          <CardHeader className="relative">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, -6, 6, -6, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.5 }}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15"
                >
                  <Sparkles className="h-5 w-5 text-[#FF5F02]" />
                </motion.div>
                <div className="min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold text-white line-clamp-1">{courseName}</h1>
                  {courseDescription ? (
                    <p className="mt-1 text-sm md:text-base text-white/70 line-clamp-2">{courseDescription}</p>
                  ) : null}
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
                <Badge className="rounded-full bg-white/5 text-white/80 ring-1 ring-white/10">
                  {totalStudents} {dictionary.courses?.students || 'Students'}
                </Badge>
                {course.totalSessions ? (
                  <Badge className="rounded-full bg-white/5 text-white/80 ring-1 ring-white/10">
                    {course.totalSessions} {dictionary.courses?.sessions || 'Sessions'}
                  </Badge>
                ) : null}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Session date selector */}
        <Card className="rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/25">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-blue-500/70 to-cyan-500/60 ring-1 ring-white/10 shadow-lg shadow-blue-500/20">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{dictionary.courses?.sessionDate || 'Session Date'}</h3>
                  <p className="text-sm text-white/60">{dictionary.courses?.sessionDateSelectorDescription || ''}</p>
                </div>
              </div>

              <div className="shrink-0 w-full md:w-80">
                <Input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full h-14 text-lg font-semibold text-center rounded-2xl border border-white/10 bg-black/30 text-white shadow-sm hover:border-white/20 focus-visible:ring-2 focus-visible:ring-[#FF5F02]/40"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[{
            key: 'present',
            value: presentCount,
            label: dictionary.courses?.present || 'Present',
            icon: CheckCircle,
            colorClass: 'text-emerald-400',
          }, {
            key: 'absent',
            value: absentCount,
            label: dictionary.courses?.absent || 'Absent',
            icon: XCircle,
            colorClass: 'text-rose-400',
          }, {
            key: 'avg',
            value: avgScore > 0 ? `${avgScore}/10` : '—',
            label: dictionary.courses?.avgScore || 'Avg Score',
            icon: Star,
            colorClass: 'text-yellow-400',
          }].map(({ key, value, label, icon: Icon, colorClass }, idx) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.03, rotate: 0.25 }}
            >
              <Card className="rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/25">
                <CardContent className="p-6 text-center">
                  <Icon className={`h-10 w-10 mx-auto mb-2 ${colorClass}`} />
                  <p className="text-3xl font-bold text-white">{value}</p>
                  <p className="text-xs text-white/60 font-medium mt-1">{label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Students Grid */}
        <Card className="rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/25">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-white/70" />
                {dictionary.courses?.students || 'Students'}
              </CardTitle>
              <Badge className="rounded-full bg-white/5 text-white/80 ring-1 ring-white/10">
                {totalStudents}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {loading ? (
              <div className="text-center py-12 text-white/60">{dictionary.common?.loading || 'Loading...'}</div>
            ) : totalStudents === 0 ? (
              <div className="text-center py-12 text-white/60">
                <Users className="h-16 w-16 mx-auto mb-4 text-white/20" />
                <p className="text-lg font-medium mb-2 text-white">{dictionary.courses?.noStudentsTitle || 'No Students'}</p>
                <p className="text-sm">{dictionary.courses?.noStudentsDescription || ''}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {roster.map(({ student }, index) => {
                  const status = getStudentStatus(student.id);
                  const studentName = (student.fullName || student.username || '-').toString();

                  const statusBadge = status
                    ? (status.present
                        ? {
                            label: dictionary.courses?.present || 'Present',
                            className: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30',
                          }
                        : {
                            label: dictionary.courses?.absent || 'Absent',
                            className: 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/30',
                          })
                    : {
                        label: dictionary.courses?.notMarked || 'Not Marked',
                        className: 'bg-white/10 text-white/70 ring-1 ring-white/10',
                      };

                  return (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ scale: 1.03, rotateY: 4, rotateX: 2 }}
                      style={{ transformStyle: 'preserve-3d' }}
                      onClick={() => openStudentDialog(student)}
                      className="group cursor-pointer"
                    >
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-linear-to-br from-blue-500/10 via-transparent to-[#FF5F02]/10 opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
                        <Card className="relative rounded-3xl border border-white/10 bg-black/20 shadow-xl shadow-black/25 transition-colors group-hover:border-white/20">
                          <CardContent className="p-4">
                            <div className="flex justify-end mb-2">
                              <Badge className={`rounded-full ${statusBadge.className}`}>{statusBadge.label}</Badge>
                            </div>

                            <div className="flex justify-center mb-3">
                              {student.profilePicture ? (
                                <img
                                  src={student.profilePicture}
                                  alt={studentName}
                                  className="w-20 h-20 rounded-2xl object-cover ring-1 ring-white/15"
                                />
                              ) : (
                                <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center ring-1 ring-white/10">
                                  <UserCircle className="h-12 w-12 text-white/70" />
                                </div>
                              )}
                            </div>

                            <h3 className="text-center font-bold text-white text-sm mb-2 line-clamp-2 min-h-10">{studentName}</h3>

                            {status?.score ? (
                              <div className="flex items-center justify-center gap-1 mb-2">
                                <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
                                <span className="text-base font-bold text-white">{status.score}/10</span>
                              </div>
                            ) : null}

                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full rounded-2xl border border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                openStudentDialog(student);
                              }}
                            >
                              <Plus className="h-4 w-4 me-1" />
                              {dictionary.courses?.mark || 'Mark'}
                              <ChevronRight className={`h-4 w-4 ms-1 ${locale === 'ar' ? 'rotate-180' : ''}`} />
                            </Button>

                            {status?.notes ? (
                              <div className="mt-2 text-center">
                                <Badge className="rounded-full text-xs bg-blue-500/10 text-blue-200 ring-1 ring-blue-500/20">
                                  {dictionary.courses?.notes || 'Notes'}
                                </Badge>
                              </div>
                            ) : null}
                          </CardContent>
                        </Card>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance Dialog */}
      {selectedStudent && (
        <StudentAttendanceDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          student={selectedStudent}
          courseId={course.id}
          sessionDate={sessionDate}
          dictionary={dictionary}
          locale={locale}
          onSaved={handleAttendanceSaved}
        />
      )}
    </motion.div>
  );
}
