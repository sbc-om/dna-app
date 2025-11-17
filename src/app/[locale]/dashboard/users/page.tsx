import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { listUsers } from '@/lib/db/repositories/userRepository';
import { UsersClient } from '@/components/UsersClient';
import { requireAdmin } from '@/lib/auth/auth';

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
  
  // Only admin can access users page
  await requireAdmin(locale);
  
  const dictionary = await getDictionary(locale);
  const users = await listUsers();

  return (
    <UsersClient
      dictionary={dictionary}
      initialUsers={users}
    />
  );
}
