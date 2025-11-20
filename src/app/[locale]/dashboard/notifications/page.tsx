import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { NotificationsClient } from '@/components/NotificationsClient';

interface NotificationsPageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function NotificationsPage({ params }: NotificationsPageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl space-y-6">
        <NotificationsClient dictionary={dictionary} locale={locale} />
      </div>
    </div>
  );
}
