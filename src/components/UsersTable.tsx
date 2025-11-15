'use client';

import { useState } from 'react';
import { User } from '@/lib/db/repositories/userRepository';
import { Role } from '@/lib/access-control/permissions';
import { Dictionary } from '@/lib/i18n/getDictionary';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { deleteUserAction } from '@/lib/actions/userActions';
import { Badge } from '@/components/ui/badge';
import { EditUserDialog } from '@/components/EditUserDialog';

export interface UsersTableProps {
  users: User[];
  roles: Role[];
  dictionary: Dictionary;
  onUsersChange: (users: User[]) => void;
}

export function UsersTable({ users, roles, dictionary, onUsersChange }: UsersTableProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (userId: string) => {
    if (!confirm(dictionary.users.confirmDelete)) {
      return;
    }

    setIsDeleting(userId);
    const result = await deleteUserAction(userId);
    setIsDeleting(null);

    if (result.success) {
      onUsersChange(users.filter((u) => u.id !== userId));
    } else {
      alert(result.error || 'Failed to delete user');
    }
  };

  const getRoleNames = (groupIds: string[]) => {
    return groupIds
      .map((id) => roles.find((r) => r.id === id)?.name)
      .filter(Boolean)
      .join(', ') || '-';
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {dictionary.users.noUsers}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{dictionary.users.name}</TableHead>
              <TableHead>{dictionary.common.email}</TableHead>
              <TableHead>{dictionary.common.username}</TableHead>
              <TableHead>{dictionary.users.role}</TableHead>
              <TableHead>{dictionary.users.status}</TableHead>
              <TableHead className="text-right">{dictionary.common.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.fullName || '-'}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{getRoleNames(user.groupIds)}</TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? 'default' : 'secondary'}>
                    {user.isActive ? dictionary.users.active : dictionary.users.inactive}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingUser(user)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(user.id)}
                    disabled={isDeleting === user.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open: boolean) => !open && setEditingUser(null)}
          dictionary={dictionary}
          roles={roles}
          onUserUpdated={(updatedUser: User) => {
            onUsersChange(
              users.map((u) => (u.id === updatedUser.id ? updatedUser : u))
            );
            setEditingUser(null);
          }}
        />
      )}
    </>
  );
}
