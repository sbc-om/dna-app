import { requireAuth } from '@/lib/auth/auth';
import { requireAcademyContext } from '@/lib/academies/academyContext';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { findUserById } from '@/lib/db/repositories/userRepository';
import { getPlayerProfile } from '@/lib/db/repositories/playerProfileRepository';
import { getLatestDnaAssessmentSession } from '@/lib/db/repositories/dnaAssessmentRepository';
import { listProgramEnrollmentsByUser } from '@/lib/db/repositories/programEnrollmentRepository';
import { findProgramLevelById } from '@/lib/db/repositories/programLevelRepository';
import { getStageAccentColor } from '@/lib/theme/accentColors';
import { notFound, redirect } from 'next/navigation';
import { ROLES } from '@/config/roles';
import { AchievementsStatsClient } from '@/components/AchievementsStatsClient';
import { requireUserInAcademy } from '@/lib/academies/academyGuards';

export default async function KidAchievementsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params as { locale: Locale; id: string };
  const dictionary = await getDictionary(locale);
  const currentUser = await requireAuth(locale);
  const academyCtx = await requireAcademyContext(locale);

  // Prevent cross-academy access via global user IDs.
  await requireUserInAcademy({ academyId: academyCtx.academyId, userId: id });

  // Fetch the kid
  const kid = await findUserById(id);

  if (!kid) {
    notFound();
  }

  // Check access: Admin, Manager, Coach can view any kid, Parent can view their own kids
  if (currentUser.role === ROLES.PARENT) {
    if (kid.parentId !== currentUser.id) {
      redirect(`/${locale}/dashboard`);
    }
  } else if (currentUser.role === ROLES.PLAYER) {
    if (currentUser.id !== id) {
      redirect(`/${locale}/dashboard`);
    }
  } else if (![ROLES.ADMIN, ROLES.MANAGER, ROLES.COACH].includes(currentUser.role as any)) {
    redirect(`/${locale}/dashboard`);
  }

  // Get player profile (scoped to the currently selected academy)
  const profile = await getPlayerProfile(academyCtx.academyId, id);

  if (!profile) {
    notFound();
  }

  const latestAssessment = await getLatestDnaAssessmentSession({
    academyId: academyCtx.academyId,
    playerId: id,
  });

  // Prefer program level accent color (if the player is enrolled in any program with a colored level)
  // and fallback to stage accent color.
  const enrollments = await listProgramEnrollmentsByUser({ academyId: academyCtx.academyId, userId: id });
  const levels = await Promise.all(
    enrollments.map((e) => (e.currentLevelId ? findProgramLevelById(e.currentLevelId) : Promise.resolve(null)))
  );
  const accentColor = levels.find((l) => l?.color)?.color ?? getStageAccentColor(profile.currentStage);

  return (
    <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 max-w-7xl space-y-6 overflow-x-hidden">
      <AchievementsStatsClient
        dictionary={dictionary}
        locale={locale}
        kid={kid}
        profile={profile}
        latestAssessment={latestAssessment}
        accentColor={accentColor}
      />
    </div>
  );
}
