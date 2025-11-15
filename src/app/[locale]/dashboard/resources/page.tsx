import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { listResources } from '@/lib/db/repositories/resourceRepository';
import { ResourcesClient } from '@/components/ResourcesClient';

export default async function ResourcesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
  const dictionary = await getDictionary(locale);

  const resources = await listResources();

  return (
    <ResourcesClient
      dictionary={dictionary}
      initialResources={resources}
    />
  );
}
