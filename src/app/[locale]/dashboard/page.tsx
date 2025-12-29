import { requireAcademyContext } from '@/lib/academies/academyContext';
import { requireAuth } from '@/lib/auth/auth';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { ROLE_LABELS } from '@/config/roles';
import { listUsers, getChildrenByParentId, getUsersByIds, findUserById } from '@/lib/db/repositories/userRepository';
import { listAcademyMembers } from '@/lib/db/repositories/academyMembershipRepository';
import { getCoursesByCoachIdAndAcademyId, type Course, getCoursesByAcademyId, getAllCourses } from '@/lib/db/repositories/courseRepository';
import { getPaidEnrollmentsByCourseIdAndAcademyId, getEnrollmentsByAcademyId, getAllEnrollments } from '@/lib/db/repositories/enrollmentRepository';
import { ensurePlayerProfile } from '@/lib/db/repositories/playerProfileRepository';
import { getLatestDnaAssessmentSession } from '@/lib/db/repositories/dnaAssessmentRepository';
import { evaluateStage, daysBetween, type OrganizationType, type PlayerStageKey } from '@/lib/player/stageSystem';
import { getAttendanceByCourse } from '@/lib/db/repositories/attendanceRepository';
import { findAcademyById } from '@/lib/db/repositories/academyRepository';
import { DashboardHomeClient } from '@/components/DashboardHomeClient';
import { type AcademyAdminDashboardData, type AcademyAdminPlayerRow } from '@/components/AcademyAdminDashboardHomeClient';
import { KidProfileClient } from '@/components/KidProfileClient';
import { requireUserInAcademy } from '@/lib/academies/academyGuards';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
  const dictionary = await getDictionary(locale);
  const user = await requireAuth(locale);
  const ctx = user.role === 'admin' ? null : await requireAcademyContext(locale);
  const roleLabel = ROLE_LABELS[user.role][locale] || user.role;

  // PLAYER: show a complete professional profile on the dashboard home.
  // This reuses the same profile UI as admin/coach/parent views, but in read-only mode.
  if (user.role === 'player') {
    // Prevent cross-academy access via global user IDs.
    await requireUserInAcademy({ academyId: ctx!.academyId, userId: user.id });

    const player = await findUserById(user.id);
    if (!player) {
      // Should never happen for an authenticated user, but keep the UI safe.
      return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl space-y-6 overflow-x-hidden">
          <div className="rounded-2xl border-2 border-[#DDDDDD] bg-white p-8 text-center shadow-lg dark:border-[#000000] dark:bg-[#262626]">
            <div className="text-[#262626] dark:text-white text-lg font-semibold">
              {dictionary.common?.errors?.notFound || 'Not found'}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl space-y-6 overflow-x-hidden">
        <KidProfileClient
          dictionary={dictionary}
          locale={locale}
          kid={player}
          currentUser={user}
          academyId={ctx!.academyId}
        />
      </div>
    );
  }

  // Fetch children for parent
  let children: any[] = [];
  if (user.role === 'parent') {
    children = await getChildrenByParentId(user.id);
  }

  // Fetch statistics for admin
  let stats = null;
  if (user.role === 'admin') {
    const users = await listUsers();
    const courses = await getAllCourses();
    const enrollments = await getAllEnrollments();
    
    stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      totalCourses: courses.length,
      activeCourses: courses.filter(c => c.isActive).length,
      totalEnrollments: enrollments.length,
      paidEnrollments: enrollments.filter(e => e.paymentStatus === 'paid').length,
      totalCoaches: users.filter(u => u.role === 'coach').length,
      totalPlayers: users.filter(u => u.role === 'player').length,
    };
  }

  // Academy Admin (manager) dashboard overview
  let managerDashboard: AcademyAdminDashboardData | null = null;
  if (user.role === 'manager') {
    const members = await listAcademyMembers(ctx!.academyId);
    const ids = Array.from(new Set(members.map((m) => m.userId)));
    const users = await getUsersByIds(ids);
    const kids = users.filter((u) => u.role === 'player' && u.isActive);

    const academy = await findAcademyById(ctx!.academyId);
    const organizationType: OrganizationType = (academy as any)?.organizationType === 'school' ? 'school' : 'academy';

    // Preload player profiles.
    const profiles = await Promise.all(
      kids.map(async (k) => ({
        userId: k.id,
        profile: await ensurePlayerProfile({ academyId: ctx!.academyId, userId: k.id }),
      }))
    );
    const profileByUserId = new Map(profiles.map((p) => [p.userId, p.profile] as const));

    // Batch attendance: scan once per course in this academy.
    const enrollments = await getEnrollmentsByAcademyId(ctx!.academyId);
    const kidIdSet = new Set(kids.map((k) => k.id));
    const courseIds = new Set<string>();
    const studentToCourseIds = new Map<string, Set<string>>();

    for (const e of enrollments) {
      if (!kidIdSet.has(e.studentId)) continue;
      courseIds.add(e.courseId);
      const set = studentToCourseIds.get(e.studentId) ?? new Set<string>();
      set.add(e.courseId);
      studentToCourseIds.set(e.studentId, set);
    }

    const attendanceByStudent = new Map<string, Array<{ sessionDate: string; present: boolean }>>();
    const attendanceByCourse = await Promise.all(
      Array.from(courseIds).map(async (courseId) => ({
        courseId,
        records: await getAttendanceByCourse(courseId),
      }))
    );
    for (const { courseId, records } of attendanceByCourse) {
      for (const r of records) {
        // Only consider students that are enrolled in this course.
        const allowed = studentToCourseIds.get(r.studentId);
        if (!allowed || !allowed.has(courseId)) continue;
        const arr = attendanceByStudent.get(r.studentId) ?? [];
        arr.push({ sessionDate: r.sessionDate, present: r.present });
        attendanceByStudent.set(r.studentId, arr);
      }
    }

    const stageCounts: Record<PlayerStageKey, number> = {
      explorer: 0,
      foundation: 0,
      active_player: 0,
      competitor: 0,
      champion: 0,
    };

    const reassessmentDays = organizationType === 'school' ? 365 : 90;
    const nowIso = new Date().toISOString();

    const players: AcademyAdminPlayerRow[] = await Promise.all(
      kids.map(async (k) => {
        const profile = profileByUserId.get(k.id)!;
        stageCounts[profile.currentStage] += 1;

        const latest = await getLatestDnaAssessmentSession({ academyId: ctx!.academyId, playerId: k.id });
        const currentNaScore = latest?.naScore;

        const records = attendanceByStudent.get(k.id) ?? [];
        const stageStartIso = profile.stageStartDate;
        const stageStartDay = stageStartIso.slice(0, 10); // YYYY-MM-DD
        let totalSessions = 0;
        let presentSessions = 0;
        for (const r of records) {
          // attendance sessionDate is YYYY-MM-DD
          if (r.sessionDate >= stageStartDay) {
            totalSessions += 1;
            if (r.present) presentSessions += 1;
          }
        }
        const attendanceRate = totalSessions > 0 ? presentSessions / totalSessions : 0;

        const evaluation = evaluateStage({
          currentStage: profile.currentStage,
          stageStartDate: profile.stageStartDate,
          organizationType,
          stageEntryNaScore: profile.stageEntryNaScore,
          currentNaScore,
          attendanceRate,
          nowIso,
        });

        const needsReassessment =
          !profile.lastAssessmentAt || daysBetween(profile.lastAssessmentAt, nowIso) >= reassessmentDays;

        return {
          userId: k.id,
          displayName: k.fullName || k.username,
          stage: profile.currentStage,
          lastAssessmentAt: profile.lastAssessmentAt,
          readyForStageUpgrade: evaluation.readyForStageUpgrade,
          needsReassessment,
        };
      })
    );

    const playersReadyForStageUpgrade = players.filter((p) => p.readyForStageUpgrade).length;
    const playersNeedingReassessment = players.filter((p) => p.needsReassessment).length;

    managerDashboard = {
      academyName: academy?.name,
      academyNameAr: academy?.nameAr,
      academyImage: (academy as any)?.image,
      totalPlayers: players.length,
      stageCounts,
      playersReadyForStageUpgrade,
      playersNeedingReassessment,
      players: players.sort((a, b) => a.displayName.localeCompare(b.displayName)),
    };
  }

  // Fetch courses for coach
  let coachCourses: Array<{ course: Course; activePlayers: number }> = [];
  if (user.role === 'coach') {
    const courses = await getCoursesByCoachIdAndAcademyId(user.id, ctx!.academyId);

    if (courses.length > 0) {
      coachCourses = await Promise.all(
        courses.map(async (course) => {
          const paidEnrollments = await getPaidEnrollmentsByCourseIdAndAcademyId(course.id, ctx!.academyId);

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

  const parentChildren = children.map((c) => ({
    id: c.id,
    username: c.username,
    fullName: c.fullName,
    nationalId: (c as any).nationalId,
    profilePicture: (c as any).profilePicture,
    createdAt: c.createdAt,
    birthDate: (c as any).birthDate,
    dateOfBirth: (c as any).dateOfBirth,
  }));

  const coachCoursesSummary = coachCourses.map(({ course, activePlayers }) => ({
    activePlayers,
    course: {
      id: course.id,
      name: course.name,
      nameAr: course.nameAr,
      isActive: course.isActive,
      startDate: course.startDate,
      endDate: course.endDate,
      courseImage: (course as any).courseImage,
    },
  }));

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl space-y-6 overflow-x-hidden">
      <DashboardHomeClient
        locale={locale}
        dictionary={dictionary}
        user={{ id: user.id, username: user.username, fullName: user.fullName, role: user.role }}
        roleLabel={roleLabel}
        adminStats={stats}
        managerDashboard={managerDashboard}
        parentChildren={parentChildren}
        coachCourses={coachCoursesSummary}
      />
    </div>
  );
}
