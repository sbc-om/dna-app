import { requireAuth } from '@/lib/auth/auth';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { SettingsClient } from '@/components/SettingsClient';
import { getRolePermissions } from '@/lib/db/repositories/rolePermissionRepository';
import { redirect } from 'next/navigation';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
  const dictionary = await getDictionary(locale);
  const user = await requireAuth(locale);
  const permissions = await getRolePermissions(user.role);

  if (!permissions?.permissions.canAccessSettings) {
    redirect(`/${locale}/dashboard/forbidden`);
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl space-y-6">
        <SettingsClient 
          dictionary={dictionary} 
          locale={locale} 
          permissions={permissions.permissions}
        />
      </div>
    </div>
  );
}
