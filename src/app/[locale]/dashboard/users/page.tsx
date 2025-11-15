import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { listUsers } from '@/lib/db/repositories/userRepository';
import { listRoles } from '@/lib/db/repositories/roleRepository';
import { UsersClient } from '@/components/UsersClient';
import { requirePermission } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
  
  // Check permission
  try {
    await requirePermission('dashboard.users', 'read');
  } catch (error) {
    console.error('Access denied to users page:', error);
    redirect(`/${locale}/dashboard/forbidden`);
  }
  
  const dictionary = await getDictionary(locale);

  const users = await listUsers();
  const roles = await listRoles();

  return (
    <UsersClient
      dictionary={dictionary}
      initialUsers={users}
      roles={roles}
    />
  );
}
