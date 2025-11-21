import { requireAuth } from '@/lib/auth/auth';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { getChildrenByParentId } from '@/lib/db/repositories/userRepository';
import { Users } from 'lucide-react';
import Link from 'next/link';
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl space-y-6">
      <h1 className="text-3xl font-bold text-[#1E3A8A]">
        {dictionary.users.children}
      </h1>
      
      {children.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border-2 border-dashed border-gray-300 text-center">
          <p className="text-gray-500 text-lg">{dictionary.users.noChildren}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <Link 
              key={child.id} 
              href={`/${locale}/dashboard/kids/${child.id}`}
              className="block group"
            >
              <div className="bg-white p-6 rounded-xl border-2 border-blue-100 shadow-md hover:shadow-xl hover:border-blue-300 transition-all duration-300">
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <div className="bg-blue-100 p-4 rounded-full group-hover:bg-blue-200 transition-colors">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {child.fullName || child.username}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {child.nationalId ? `${dictionary.users.nationalId}: ${child.nationalId}` : child.username}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
