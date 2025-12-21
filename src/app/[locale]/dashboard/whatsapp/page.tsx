import { requireAuth } from '@/lib/auth/auth';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import WhatsAppMessagingClient from '@/components/WhatsAppMessagingClient';
import { redirect } from 'next/navigation';
import { getRolePermissions } from '@/lib/db/repositories/rolePermissionRepository';

export default async function WhatsAppMessagingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
  const dictionary = await getDictionary(locale);
  const currentUser = await requireAuth(locale);

  const rolePermissions = await getRolePermissions(currentUser.role);
  if (!rolePermissions?.permissions.canSendWhatsApp) {
    redirect(`/${locale}/dashboard/forbidden`);
  }

  return (
    <WhatsAppMessagingClient 
      dictionary={dictionary} 
      locale={locale} 
    />
  );
}
