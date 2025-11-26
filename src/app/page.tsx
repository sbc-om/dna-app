import { redirect } from 'next/navigation';
import { defaultLocale } from '@/config/i18n';
import { cookies } from 'next/headers';

export default async function RootPage() {
  // Try to get user's preferred locale from cookie
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || defaultLocale;
  
  redirect(`/${locale}`);
}
