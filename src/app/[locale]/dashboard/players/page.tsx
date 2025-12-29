import { requireAuth } from '@/lib/auth/auth';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { getChildrenByParentId } from '@/lib/db/repositories/userRepository';
import { PlayerPreviewCard } from '@/components/PlayerPreviewCard';
import { redirect } from 'next/navigation';

export default async function KidsListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
  const dictionary = await getDictionary(locale);
  const user = await requireAuth(locale);

  if (user.role !== 'parent') {
    redirect(`/${locale}/dashboard`);
  }

  const children = await getChildrenByParentId(user.id);

  return (
    <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-6 max-w-7xl space-y-6">
      <div className="relative overflow-hidden rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-br from-slate-950 via-indigo-950 to-purple-950 p-6 sm:p-8 shadow-lg">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -left-24 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        </div>

        <div className="relative">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            {dictionary.users.children}
          </h1>
          <p className="mt-2 text-white/70 font-semibold">
            {dictionary.users?.viewChildrenHint || 'Select a player to view their profile.'}
          </p>
        </div>
      </div>
      
      {children.length === 0 ? (
        <div className="rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] p-8 text-center shadow-lg">
          <p className="text-[#262626] dark:text-white text-lg font-semibold">{dictionary.users.noChildren}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <PlayerPreviewCard key={child.id} locale={locale} dictionary={dictionary} child={child} />
          ))}
        </div>
      )}
    </div>
  );
}
