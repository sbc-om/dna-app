import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { listRoles } from '@/lib/db/repositories/roleRepository';
import { listResources } from '@/lib/db/repositories/resourceRepository';
import { RolesClient } from '@/components/RolesClient';
import { requirePermission } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';

export default async function RolesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
  
  // Check permission
  try {
    await requirePermission('dashboard.roles', 'read');
  } catch (error) {
    console.error('Access denied to roles page:', error);
    redirect(`/${locale}/dashboard/forbidden`);
  }
  
  const dictionary = await getDictionary(locale);

  const roles = await listRoles();
  const resources = await listResources();

  return (
    <RolesClient
      dictionary={dictionary}
      initialRoles={roles}
      resources={resources}
    />
  );
}
