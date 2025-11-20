import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { requireAdmin } from '@/lib/auth/auth';
import { RolesPermissionsClient } from '@/components/RolesPermissionsClient';
import { getAllRolePermissions, initializeDefaultRolePermissions } from '@/lib/db/repositories/rolePermissionRepository';

export default async function RolesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
  
  // Only admin can access roles page
  await requireAdmin(locale);
  
  // Initialize default permissions if not exists
  await initializeDefaultRolePermissions();
  
  const dictionary = await getDictionary(locale);
  const rolePermissions = await getAllRolePermissions();

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl space-y-6">
        <RolesPermissionsClient
          dictionary={dictionary}
          initialRolePermissions={rolePermissions}
        />
      </div>
    </div>
  );
}
