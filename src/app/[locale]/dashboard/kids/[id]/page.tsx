import { requireAuth } from '@/lib/auth/auth';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { findUserById } from '@/lib/db/repositories/userRepository';
import { notFound, redirect } from 'next/navigation';
import { KidProfileClient } from '@/components/KidProfileClient';

export default async function KidProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params as { locale: Locale; id: string };
  const dictionary = await getDictionary(locale);
  const user = await requireAuth(locale);

  // Fetch the kid
  const kid = await findUserById(id);

  if (!kid) {
    notFound();
  }

  // Security check: Only Admin or the Parent of the kid can view this
  const isParent = user.role === 'parent' && kid.parentId === user.id;
  const isAdmin = user.role === 'admin';

  if (!isParent && !isAdmin) {
    // If not authorized, redirect to dashboard
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      <KidProfileClient
        dictionary={dictionary}
        locale={locale}
        kid={kid}
        currentUser={user}
      />
    </div>
  );
}
