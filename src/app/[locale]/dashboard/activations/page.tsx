import { redirect } from 'next/navigation';
import type { Locale } from '@/config/i18n';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { requireAuth } from '@/lib/auth/auth';
import { hasRolePermission } from '@/lib/db/repositories/rolePermissionRepository';
import { requireAcademyContext } from '@/lib/academies/academyContext';
import { listAcademyMembers } from '@/lib/db/repositories/academyMembershipRepository';
import { getUsersByIds } from '@/lib/db/repositories/userRepository';
import { listAcademyActivationsAction } from '@/lib/actions/playerActivationActions';
import { ActivationsClient } from '@/components/ActivationsClient';

export default async function ActivationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: Locale };
  const user = await requireAuth(locale);

  const canManage = await hasRolePermission(user.role, 'canManageActivations');
  if (!canManage) {
    redirect(`/${locale}/dashboard/forbidden`);
  }

  const dict = await getDictionary(locale);

  const ctx = await requireAcademyContext(locale);
  const members = await listAcademyMembers(ctx.academyId);
  const ids = Array.from(new Set(members.map((m) => m.userId)));
  const users = await getUsersByIds(ids);
  const players = users
    .filter((u) => u.role === 'kid' && u.isActive)
    .map((u) => ({
      id: u.id,
      displayName: u.fullName || u.username || u.email || u.id,
      fullName: u.fullName || null,
      username: u.username || null,
      email: u.email || null,
      dnaActivationStatus: u.dnaActivationStatus || null,
      ageCategory: u.ageCategory || null,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  const res = await listAcademyActivationsAction({ locale });
  const activations = res.success ? res.activations : [];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      <ActivationsClient locale={locale} dictionary={dict} initialActivations={activations} initialPlayers={players} />
    </div>
  );
}
