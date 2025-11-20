import { requireAuth } from '@/lib/auth/auth';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { findUserById, getChildrenByParentId } from '@/lib/db/repositories/userRepository';
import { notFound } from 'next/navigation';
import { ParentProfileClient } from '@/components/ParentProfileClient';

export default async function ParentProfilePage({
  params,
}: {
  params: Promise<{ locale: string; userId: string }>;
}) {
  const { locale, userId } = await params as { locale: Locale; userId: string };
  const dictionary = await getDictionary(locale);
  const currentUser = await requireAuth(locale);

  // Get parent user
  const parent = await findUserById(userId);
  
  if (!parent) {
    notFound();
  }

  // Get children of this parent
  const children = await getChildrenByParentId(userId);

  return (
    <ParentProfileClient
      dictionary={dictionary}
      locale={locale}
      parent={parent}
      children={children}
      currentUser={currentUser}
    />
  );
}
