import { requireAuth } from '@/lib/auth/auth';
import { requireAcademyContext } from '@/lib/academies/academyContext';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { findUserById } from '@/lib/db/repositories/userRepository';
import { notFound, redirect } from 'next/navigation';
import { KidProfileClient } from '@/components/KidProfileClient';
import { requireUserInAcademy } from '@/lib/academies/academyGuards';
import { resolveTargetUserAcademyId } from '@/lib/academies/resolveTargetUserAcademy';

export default async function KidProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params as { locale: Locale; id: string };
  const dictionary = await getDictionary(locale);
  const user = await requireAuth(locale);
  const academyCtx = await requireAcademyContext(locale);

  const academyId = await resolveTargetUserAcademyId({
    viewerRole: user.role,
    preferredAcademyId: academyCtx.academyId,
    targetUserId: id,
  });

  // Prevent cross-academy access via global user IDs.
  await requireUserInAcademy({ academyId, userId: id });

  // Fetch the kid
  const kid = await findUserById(id);

  if (!kid) {
    notFound();
  }

  // Security check: Only Admin, Parent of the kid, or Coach can view this
  const isParent = user.role === 'parent' && kid.parentId === user.id;
  const isAdmin = user.role === 'admin';
  const isCoach = user.role === 'coach';
  const isManager = user.role === 'manager';
  const isSelfPlayer = user.role === 'player' && user.id === id;

  if (!isParent && !isAdmin && !isCoach && !isManager && !isSelfPlayer) {
    // If not authorized, redirect to dashboard
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 max-w-7xl space-y-6 overflow-x-hidden">
      <KidProfileClient
        dictionary={dictionary}
        locale={locale}
        kid={kid}
        currentUser={user}
        academyId={academyId}
      />
    </div>
  );
}

