import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { listResources } from '@/lib/db/repositories/resourceRepository';
import { ResourcesClient } from '@/components/ResourcesClient';
import { requirePermission } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';

export default async function ResourcesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
  
  // Check permission
  try {
    await requirePermission('dashboard.resources', 'read');
  } catch (error) {
    console.error('Access denied to resources page:', error);
    redirect(`/${locale}/dashboard/forbidden`);
  }
  
  const dictionary = await getDictionary(locale);

  const resources = await listResources();

  return (
    <ResourcesClient
      dictionary={dictionary}
      initialResources={resources}
    />
  );
}
