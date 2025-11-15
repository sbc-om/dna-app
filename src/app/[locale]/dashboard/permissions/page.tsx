import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { listUsers } from '@/lib/db/repositories/userRepository';
import { listRoles } from '@/lib/db/repositories/roleRepository';
import { listPermissions } from '@/lib/db/repositories/permissionRepository';
import { listResources } from '@/lib/db/repositories/resourceRepository';
import { PermissionsClient } from '@/components/PermissionsClient';

export default async function PermissionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
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
