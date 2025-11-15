'use client';

import { useState } from 'react';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { User } from '@/lib/db/repositories/userRepository';
import { Role } from '@/lib/access-control/permissions';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { UsersTable } from '@/components/UsersTable';
import { CreateUserDialog } from '@/components/CreateUserDialog';

export interface UsersClientProps {
  dictionary: Dictionary;
  initialUsers: User[];
  roles: Role[];
}

export function UsersClient({ dictionary, initialUsers, roles }: UsersClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleUsersChange = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{dictionary.users.title}</h1>
          <p className="text-muted-foreground mt-2">{dictionary.users.userList}</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {dictionary.users.createUser}
        </Button>
      </div>

      <UsersTable
        users={users}
        roles={roles}
        dictionary={dictionary}
        onUsersChange={handleUsersChange}
      />

      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        dictionary={dictionary}
        roles={roles}
        onUserCreated={(newUser: User) => {
          setUsers([...users, newUser]);
        }}
      />
    </div>
  );
}
