import { Locale } from '@/config/i18n';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function RegisterPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  redirect(`/${locale}/book-appointment`);
}