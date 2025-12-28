import { getDictionary } from '@/lib/i18n/getDictionary';
import type { Locale } from '@/config/i18n';
import { notFound } from 'next/navigation';
import { getPlayerActivationByToken } from '@/lib/db/repositories/playerActivationRepository';
import { findAcademyById } from '@/lib/db/repositories/academyRepository';
import { findUserById } from '@/lib/db/repositories/userRepository';
import { ParentActivationClient } from '@/components/ParentActivationClient';

export default async function ParentActivationPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = (await params) as { locale: Locale; token: string };
  const dict = await getDictionary(locale);

  const activation = await getPlayerActivationByToken(token);
  if (!activation) notFound();

  const academy = await findAcademyById(activation.academyId);
  const player = await findUserById(activation.playerId);

  if (!academy || !player) notFound();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
      <ParentActivationClient
        locale={locale}
        dictionary={dict}
        token={token}
        academy={{ id: academy.id, name: locale === 'ar' ? academy.nameAr : academy.name }}
        player={{
          id: player.id,
          fullName: player.fullName || player.username,
          birthDate: player.birthDate,
        }}
        initialParent={{
          name: activation.parentName || player.parentContactName || '',
          email: activation.parentEmail || player.parentContactEmail || '',
          phone: activation.parentPhone || player.parentContactPhone || '',
        }}
        initialStatus={activation.status}
      />
    </div>
  );
}
