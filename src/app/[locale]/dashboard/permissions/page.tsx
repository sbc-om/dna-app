import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { listUsers } from '@/lib/db/repositories/userRepository';
import { listRoles } from '@/lib/db/repositories/roleRepository';
import { listPermissions } from '@/lib/db/repositories/permissionRepository';
import { listResources } from '@/lib/db/repositories/resourceRepository';
import { PermissionsClient } from '@/components/PermissionsClient';
import { requirePermission } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';

export default async function PermissionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
  
  // Check permission
  try {
    await requirePermission('dashboard.permissions', 'read');
  } catch (error) {
    console.error('Access denied to permissions page:', error);
    redirect(`/${locale}/dashboard/forbidden`);
  }
  
  const dictionary = await getDictionary(locale);

  const [users, roles, permissions, resources] = await Promise.all([
    listUsers(),
    listRoles(),
    listPermissions(),
    listResources(),
  ]);

  return (
    <PermissionsClient
      dictionary={dictionary}
      users={users}
      roles={roles}
      permissions={permissions}
      resources={resources}
    />
  );
}
