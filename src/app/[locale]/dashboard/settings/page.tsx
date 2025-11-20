import { requireAdmin } from '@/lib/auth/auth';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { SettingsClient } from '@/components/SettingsClient';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
  const dictionary = await getDictionary(locale);
  await requireAdmin(locale);

  return <SettingsClient dictionary={dictionary} locale={locale} />;
}
