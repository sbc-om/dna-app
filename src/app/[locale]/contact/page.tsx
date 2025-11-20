import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import ContactPageClient from '@/components/ContactPageClient';
import { getCurrentUser } from '@/lib/auth/auth';

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
  const dictionary = await getDictionary(locale);
  const user = await getCurrentUser();

  return <ContactPageClient dictionary={dictionary} locale={locale} user={user} />;
}