import { requireAcademyContext } from '@/lib/academies/academyContext';
import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { MessagesClient } from '@/components/MessagesClient';
import { getAllUsers, getUsersByIds } from '@/lib/db/repositories/userRepository';
import { getRolePermissions } from '@/lib/db/repositories/rolePermissionRepository';
import { redirect } from 'next/navigation';
import { listAcademyMembers } from '@/lib/db/repositories/academyMembershipRepository';

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
  const dictionary = await getDictionary(locale);
  const { user: currentUser, academyId, academyRole } = await requireAcademyContext(locale);
  
  const rolePermissions = await getRolePermissions(currentUser.role);
  if (!rolePermissions?.permissions.canAccessMessages) {
    redirect(`/${locale}/dashboard/forbidden`);
  }
  
  // Recipient selection list (used by Admin and Manager).
  // - Admin: all users.
  // - Manager: only users who are members of the manager's academy.
  const allUsers = await (async () => {
    if (currentUser.role === 'admin') {
      return getAllUsers();
    }

    if (currentUser.role === 'manager' && academyRole === 'manager') {
      const memberships = await listAcademyMembers(academyId);
      const memberIds = Array.from(new Set(memberships.map((m) => m.userId))).filter(
        (id) => id !== currentUser.id
      );
      const users = await getUsersByIds(memberIds);
      return users.filter((u) => u.isActive);
    }

    return [];
  })();

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <MessagesClient 
        dictionary={dictionary} 
        locale={locale} 
        currentUser={currentUser}
        allUsers={allUsers}
        permissions={rolePermissions.permissions}
      />
    </div>
  );
}
