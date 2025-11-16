import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { SchedulesClient } from '@/components/SchedulesClient';

export default async function SchedulesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return <SchedulesClient dictionary={dictionary} locale={locale} />;
}
