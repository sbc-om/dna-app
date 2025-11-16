import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { AppointmentsClient } from '@/components/AppointmentsClient';

export default async function AppointmentsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return <AppointmentsClient dictionary={dictionary} locale={locale} />;
}
