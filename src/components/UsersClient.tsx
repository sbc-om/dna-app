'use client';

import { useState } from 'react';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { User } from '@/lib/db/repositories/userRepository';
import { Button } from '@/components/ui/button';
import { Plus, Shield } from 'lucide-react';
import { UsersTable } from '@/components/UsersTable';
import { CreateUserDialog } from '@/components/CreateUserDialog';
import Link from 'next/link';
import { Locale } from '@/config/i18n';

export interface UsersClientProps {
  dictionary: Dictionary;
  initialUsers: User[];
  locale: Locale;
}

export function UsersClient({ dictionary, initialUsers, locale }: UsersClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleUsersChange = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {dictionary.users.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{dictionary.users.userList}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/dashboard/roles`}>
            <Button 
              variant="outline"
              className="border-[#F2574C] text-[#F2574C] hover:bg-[#F2574C] hover:text-white"
            >
              <Shield className="mr-2 h-4 w-4" />
              {dictionary.nav.roles}
            </Button>
          </Link>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            {dictionary.users.createUser}
          </Button>
        </div>
      </div>

      <UsersTable
        users={users}
        dictionary={dictionary}
        onUsersChange={handleUsersChange}
        locale={locale}
      />

      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        dictionary={dictionary}
        onUserCreated={(newUser: User) => {
          setUsers([...users, newUser]);
        }}
      />
    </div>
  );
}
