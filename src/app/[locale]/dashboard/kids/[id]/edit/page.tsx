import { requireAuth } from '@/lib/auth/auth';
import { requireAcademyContext } from '@/lib/academies/academyContext';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { findUserById, getAllUsers } from '@/lib/db/repositories/userRepository';
import { notFound, redirect } from 'next/navigation';
import { EditKidProfileClient } from '@/components/EditKidProfileClient';
import { getAllAcademies } from '@/lib/db/repositories/academyRepository';
import { getUserAcademyIds } from '@/lib/db/repositories/academyMembershipRepository';
import { ROLES } from '@/config/roles';
import { requireUserInAcademy } from '@/lib/academies/academyGuards';

export default async function EditKidProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params as { locale: Locale; id: string };
  const dictionary = await getDictionary(locale);
  const user = await requireAuth(locale);
  const academyCtx = await requireAcademyContext(locale);

  // Only admin can edit kid profiles
  if (user.role !== 'admin') {
    redirect(`/${locale}/dashboard`);
  }

  // Fetch the kid
  const kid = await findUserById(id);

  if (!kid) {
    notFound();
  }

  // Enforce that this edit is performed within the currently selected academy.
  await requireUserInAcademy({ academyId: academyCtx.academyId, userId: id });

  // Fetch academies for selection
  const allAcademies = await getAllAcademies();
  const activeAcademies = allAcademies.filter(a => a.isActive);
  
  // Get user's current academies
  const userAcademyIds = await getUserAcademyIds(id);

  // Fetch all parents for selection
  const allUsers = await getAllUsers();
  const parents = allUsers.filter(u => u.role === ROLES.PARENT);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-4xl">
      <EditKidProfileClient
        dictionary={dictionary}
        locale={locale}
        kid={kid}
        academies={activeAcademies}
        currentAcademyIds={userAcademyIds}
        parents={parents}
      />
    </div>
  );
}
