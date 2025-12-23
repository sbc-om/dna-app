'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { User } from '@/lib/db/repositories/userRepository';
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
    const result = await deleteUserAction(userId, { locale });
    setIsDeleting(null);

    if (result.success) {
      onUsersChange(users.filter((u) => u.id !== userId));
    } else {
      alert(result.error || 'Failed to delete user');
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'profilePicture',
      header: '',
      cell: ({ row }) => {
        const user = row.original;
        const fullName = user.fullName || user.username;
        
        return (
          <div className="flex items-center justify-center">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={fullName}
                className="w-12 h-12 rounded-xl object-cover border-2 border-[#DDDDDD] dark:border-[#000000]"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[#262626] dark:bg-white flex items-center justify-center text-white dark:text-[#262626] font-bold text-base border-2 border-[#DDDDDD] dark:border-[#000000]">
                {fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'fullName',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-[#262626] dark:text-white"
          >
            {dictionary.users.name}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const fullName = row.getValue('fullName') as string;
        const user = row.original;

        // Make user names clickable
        if (user.role === 'kid') {
          return (
            <Link href={`/${locale}/dashboard/kids/${user.id}`} className="font-semibold text-[#F2574C] hover:text-[#E8A12D] hover:underline">
              {fullName || '-'}
            </Link>
          );
        }

        return (
          <Link
            href={`/${locale}/dashboard/users/${user.id}`}
            className="font-semibold text-[#262626] dark:text-white hover:underline"
          >
            {fullName || '-'}
          </Link>
        );
      },
    },
    {
      accessorKey: 'email',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-0 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-[#262626] dark:text-white"
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
            className="px-0 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-[#262626] dark:text-white"
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
          <Badge
            variant="outline"
            className="font-semibold border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-200"
          >
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
                ? 'bg-green-600/10 text-green-700 dark:text-green-400 border border-green-600/30'
                : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 border border-[#DDDDDD] dark:border-[#000000]'
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
      <div className="text-center py-16 px-4 bg-white dark:bg-[#262626] rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000]">
        <div className="max-w-md mx-auto">
          <div className="h-16 w-16 rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-gray-50 dark:bg-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
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
      <DataTable
        columns={columns}
        data={users}
        searchKey="email"
        searchPlaceholder={`${dictionary.common.search} ${dictionary.common.email.toLowerCase()}...`}
      />

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open: boolean) => !open && setEditingUser(null)}
          dictionary={dictionary}
          locale={locale}
          parents={users.filter(u => u.role === 'parent')}
          kids={users.filter(u => u.role === 'kid')}
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
