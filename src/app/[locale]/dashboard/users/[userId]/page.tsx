import { requireRole } from '@/lib/auth/auth';
import { requireAcademyContext } from '@/lib/academies/academyContext';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { findUserById, getChildrenByParentId, getAllUsers } from '@/lib/db/repositories/userRepository';
import { ROLES } from '@/config/roles';
import { getAcademyMembership, getUserAcademyRoles } from '@/lib/db/repositories/academyMembershipRepository';
import { getAllAcademies } from '@/lib/db/repositories/academyRepository';
import { notFound } from 'next/navigation';
import { KidProfileClient } from '@/components/KidProfileClient';
import { UserDetailsClient, type UserAcademyMembershipView } from '@/components/UserDetailsClient';

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ locale: string; userId: string }>;
}) {
  const { locale, userId } = await params as { locale: Locale; userId: string };
  const dictionary = await getDictionary(locale);
  const currentUser = await requireRole([ROLES.ADMIN, ROLES.MANAGER], locale);
  const academyCtx = await requireAcademyContext(locale);

  // Get user
  const targetUser = await findUserById(userId);
  
  if (!targetUser) {
    notFound();
  }

  // Managers can only view users in their current academy.
  if (currentUser.role === ROLES.MANAGER) {
    // Admin users do not have academy memberships.
    if (targetUser.role === ROLES.ADMIN) {
      notFound();
    }
    const membership = await getAcademyMembership(academyCtx.academyId, userId);
    if (!membership) {
      notFound();
    }
  }

  // If user is a kid, show kid profile
  if (targetUser.role === 'kid') {
    return (
      <div className="h-full min-h-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl space-y-6">
          <KidProfileClient
            dictionary={dictionary}
            locale={locale}
            kid={targetUser}
            currentUser={currentUser}
            academyId={academyCtx.academyId}
          />
        </div>
      </div>
    );
  }

  const [academyRoles, academies, children, allUsers] = await Promise.all([
    getUserAcademyRoles(userId),
    getAllAcademies(),
    targetUser.role === ROLES.PARENT ? getChildrenByParentId(userId) : Promise.resolve([]),
    getAllUsers(),
  ]);

  const parents = allUsers.filter(u => u.role === ROLES.PARENT);
  const kids = allUsers.filter(u => u.role === ROLES.KID);

  const memberships: UserAcademyMembershipView[] = Object.entries(academyRoles)
    .map(([academyId, memberRole]) => {
      const academy = academies.find((a) => a.id === academyId);
      return {
        academyId,
        academyName: academy?.name ?? academyId,
        academyNameAr: academy?.nameAr ?? academyId,
        academyIsActive: academy?.isActive ?? false,
        memberRole,
      };
    })
    .sort((a, b) => a.academyName.localeCompare(b.academyName));

  return (
    <div className="h-full min-h-0">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl space-y-6">
        <UserDetailsClient
          dictionary={dictionary}
          locale={locale}
          user={targetUser}
          memberships={memberships}
          children={children}
          parents={parents}
          kids={kids}
        />
      </div>
    </div>
  );
}
