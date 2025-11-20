import { requireAuth } from '@/lib/auth/auth';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { MessagesClient } from '@/components/MessagesClient';
import { getAllUsers } from '@/lib/db/repositories/userRepository';

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
  const dictionary = await getDictionary(locale);
  const currentUser = await requireAuth(locale);
  
  // Get all users for admin to see
  const allUsers = currentUser.role === 'admin' ? await getAllUsers() : [];

  return (
    <MessagesClient 
      dictionary={dictionary} 
      locale={locale} 
      currentUser={currentUser}
      allUsers={allUsers}
    />
  );
}
