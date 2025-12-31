import { requireAuth } from '@/lib/auth/auth';
import { requireAcademyContext } from '@/lib/academies/academyContext';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { findUserById } from '@/lib/db/repositories/userRepository';
import { notFound, redirect } from 'next/navigation';
import { requireUserInAcademy } from '@/lib/academies/academyGuards';
import { PlayerCardPageClient } from '@/components/PlayerCardPageClient';

export const dynamic = 'force-dynamic';

export default async function PlayerCardPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = (await params) as { locale: Locale; id: string };
  const dictionary = await getDictionary(locale);
  const user = await requireAuth(locale);
  const academyCtx = await requireAcademyContext(locale);

  // Prevent cross-academy access via global user IDs.
  await requireUserInAcademy({ academyId: academyCtx.academyId, userId: id });

  const kid = await findUserById(id);
  if (!kid) notFound();

  // Access: Admin / Manager / Coach can view any player in academy, Parent can view their own child, Player can view self.
  const isParent = user.role === 'parent' && kid.parentId === user.id;
  const isAdmin = user.role === 'admin';
  const isCoach = user.role === 'coach';
  const isManager = user.role === 'manager';
  const isSelfPlayer = user.role === 'player' && user.id === id;

  if (!isParent && !isAdmin && !isCoach && !isManager && !isSelfPlayer) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 max-w-7xl space-y-6 overflow-x-hidden">
      <PlayerCardPageClient
        dictionary={dictionary}
        locale={locale}
        academyId={academyCtx.academyId}
        kid={kid}
      />
    </div>
  );
}
