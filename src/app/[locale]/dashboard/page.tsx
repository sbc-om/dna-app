import { requireAcademyContext } from '@/lib/academies/academyContext';
import { requireAuth } from '@/lib/auth/auth';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { ROLE_LABELS } from '@/config/roles';
import { listUsers, getChildrenByParentId, getUsersByIds, findUserById } from '@/lib/db/repositories/userRepository';
import { listAcademyMembers } from '@/lib/db/repositories/academyMembershipRepository';
import { ensurePlayerProfile } from '@/lib/db/repositories/playerProfileRepository';
import { findAcademyById } from '@/lib/db/repositories/academyRepository';
import { DashboardHomeClient } from '@/components/DashboardHomeClient';
import { type AcademyAdminDashboardData, type AcademyAdminPlayerRow } from '@/components/AcademyAdminDashboardHomeClient';
import { KidProfileClient } from '@/components/KidProfileClient';
import { requireUserInAcademy } from '@/lib/academies/academyGuards';
import { daysBetweenIso } from '@/lib/utils/date';

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
              {dictionary.errors?.notFound || 'Not found'}
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
    const isSchool = (academy as any)?.organizationType === 'school';

    // Preload player profiles.
    const profiles = await Promise.all(
      kids.map(async (k) => ({
        userId: k.id,
        profile: await ensurePlayerProfile({ academyId: ctx!.academyId, userId: k.id }),
      }))
    );
    const profileByUserId = new Map(profiles.map((p) => [p.userId, p.profile] as const));

    const reassessmentDays = isSchool ? 365 : 90;
    const nowIso = new Date().toISOString();

    const players: AcademyAdminPlayerRow[] = await Promise.all(
      kids.map(async (k) => {
        const profile = profileByUserId.get(k.id)!;
        const needsReassessment =
          !profile.lastAssessmentAt || daysBetweenIso(profile.lastAssessmentAt, nowIso) >= reassessmentDays;

        return {
          userId: k.id,
          displayName: k.fullName || k.username,
          lastAssessmentAt: profile.lastAssessmentAt,
          needsReassessment,
        };
      })
    );

    const playersNeedingReassessment = players.filter((p) => p.needsReassessment).length;

    managerDashboard = {
      academyName: academy?.name,
      academyNameAr: academy?.nameAr,
      academyImage: (academy as any)?.image,
      totalPlayers: players.length,
      playersNeedingReassessment,
      players: players.sort((a, b) => a.displayName.localeCompare(b.displayName)),
    };
  }

  // Coach no longer has courses section - redirect to programs

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
      />
    </div>
  );
}
