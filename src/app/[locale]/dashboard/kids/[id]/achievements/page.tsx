import { requireAuth } from '@/lib/auth/auth';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { findUserById } from '@/lib/db/repositories/userRepository';
import { getPlayerProfile } from '@/lib/db/repositories/playerProfileRepository';
import { notFound, redirect } from 'next/navigation';
import { ROLES } from '@/config/roles';
import { AchievementsStatsClient } from '@/components/AchievementsStatsClient';

export default async function KidAchievementsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params as { locale: Locale; id: string };
  const dictionary = await getDictionary(locale);
  const currentUser = await requireAuth(locale);

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
  } else if (![ROLES.ADMIN, ROLES.MANAGER, ROLES.COACH].includes(currentUser.role as any)) {
    redirect(`/${locale}/dashboard`);
  }

  // Get player profile
  const profile = await getPlayerProfile(id);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      <AchievementsStatsClient
        dictionary={dictionary}
        locale={locale}
        kid={kid}
        profile={profile}
        currentUser={currentUser}
      />
    </div>
  );
}
