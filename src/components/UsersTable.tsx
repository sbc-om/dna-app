'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { User } from '@/lib/db/repositories/userRepository';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/ui/data-table';
import { EditUserDialog } from '@/components/EditUserDialog';
import { deleteUserAction } from '@/lib/actions/userActions';
import Link from 'next/link';

export interface UsersTableProps {
  users: User[];
  dictionary: Dictionary;
  onUsersChange: (users: User[]) => void;
  locale: string;
}

export function UsersTable({ users, dictionary, onUsersChange, locale }: UsersTableProps) {
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

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'fullName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="hover:bg-purple-100 dark:hover:bg-purple-900/30"
          >
            {dictionary.users.name}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const fullName = row.getValue('fullName') as string;
        const user = row.original;
        
        // Make parent and kid names clickable
        if (user.role === 'parent') {
          return (
            <Link href={`/${locale}/dashboard/users/${user.id}`} className="font-semibold text-[#30B2D2] hover:text-[#1E3A8A] hover:underline">
              {fullName || '-'}
            </Link>
          );
        }
        
        if (user.role === 'kid') {
          return (
            <Link href={`/${locale}/dashboard/kids/${user.id}`} className="font-semibold text-[#F2574C] hover:text-[#E8A12D] hover:underline">
              {fullName || '-'}
            </Link>
          );
        }
        
        return <div className="font-semibold text-gray-900 dark:text-gray-100">{fullName || '-'}</div>;
      },
    },
    {
      accessorKey: 'email',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="hover:bg-purple-100 dark:hover:bg-purple-900/30"
          >
            {dictionary.common.email}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <div className="text-gray-700 dark:text-gray-300">{row.getValue('email')}</div>;
      },
    },
    {
      accessorKey: 'username',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="hover:bg-purple-100 dark:hover:bg-purple-900/30"
          >
            {dictionary.common.username}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <div className="text-gray-700 dark:text-gray-300">{row.getValue('username')}</div>;
      },
    },
    {
      accessorKey: 'role',
      header: dictionary.users.role,
      cell: ({ row }) => {
        const role = row.getValue('role') as string;
        return (
          <Badge variant="outline" className="font-medium">
            {role?.toUpperCase() || '-'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: dictionary.users.status,
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean;
        return (
          <Badge
            variant={isActive ? 'default' : 'secondary'}
            className={
              isActive
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }
          >
            {isActive ? dictionary.users.active : dictionary.users.inactive}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">{dictionary.common.actions}</div>,
      cell: ({ row }) => {
        const user = row.original;

        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{dictionary.common.actions}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setEditingUser(user)}
                  className="cursor-pointer"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {dictionary.common.edit}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(user.id)}
                  disabled={isDeleting === user.id}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {dictionary.common.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  if (users.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl shadow-xl border-0">
        <div className="max-w-md mx-auto">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-8 w-8 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">{dictionary.users.noUsers}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border-0 shadow-xl overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur p-6">
        <DataTable
          columns={columns}
          data={users}
          searchKey="email"
          searchPlaceholder={`${dictionary.common.search} ${dictionary.common.email.toLowerCase()}...`}
        />
      </div>

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open: boolean) => !open && setEditingUser(null)}
          dictionary={dictionary}
          locale={locale}
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
