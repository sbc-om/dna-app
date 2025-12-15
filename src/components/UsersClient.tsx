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
  const [selectedRole, setSelectedRole] = useState<string>('all');

  const filterLabel = locale === 'ar' ? 'تصفية حسب الدور' : 'Filter by Role';

  const roleOptions = [
    {
      key: 'all',
      label: locale === 'ar' ? 'الكل' : 'All',
      count: users.length,
      accentClass: 'border-neutral-400 text-neutral-700 dark:text-neutral-200',
    },
    {
      key: 'admin',
      label: locale === 'ar' ? 'مشرف' : 'Admin',
      count: users.filter((u) => u.role === 'admin').length,
      accentClass: 'border-violet-500 text-violet-700 dark:text-violet-400',
    },
    {
      key: 'manager',
      label: locale === 'ar' ? 'مدير أكاديمية' : 'Manager',
      count: users.filter((u) => u.role === 'manager').length,
      accentClass: 'border-emerald-500 text-emerald-700 dark:text-emerald-400',
    },
    {
      key: 'coach',
      label: locale === 'ar' ? 'مدرب' : 'Coach',
      count: users.filter((u) => u.role === 'coach').length,
      accentClass: 'border-blue-500 text-blue-700 dark:text-blue-400',
    },
    {
      key: 'parent',
      label: locale === 'ar' ? 'ولي أمر' : 'Parent',
      count: users.filter((u) => u.role === 'parent').length,
      accentClass: 'border-sky-500 text-sky-700 dark:text-sky-400',
    },
    {
      key: 'kid',
      label: locale === 'ar' ? 'طالب' : 'Student',
      count: users.filter((u) => u.role === 'kid').length,
      accentClass: 'border-red-500 text-red-700 dark:text-red-400',
    },
  ] as const;

  const handleUsersChange = (nextUsersFromTable: User[]) => {
    setUsers((prev) => {
      // When not filtered, the table operates on the full dataset.
      if (selectedRole === 'all') {
        return nextUsersFromTable;
      }

      // When role-filtered, the table only sees the visible subset.
      // Merge updates into the full list instead of replacing it.
      const prevVisible = prev.filter((u) => u.role === selectedRole);
      const prevVisibleIds = new Set(prevVisible.map((u) => u.id));
      const nextVisibleIds = new Set(nextUsersFromTable.map((u) => u.id));
      const nextById = new Map(nextUsersFromTable.map((u) => [u.id, u] as const));

      const merged: User[] = [];

      for (const u of prev) {
        if (prevVisibleIds.has(u.id)) {
          // Deleted from visible subset
          if (!nextVisibleIds.has(u.id)) {
            continue;
          }
          // Updated in visible subset
          merged.push(nextById.get(u.id) ?? u);
          continue;
        }
        merged.push(u);
      }

      // Safety: if the subset contains new IDs not in prev, append them.
      const prevIds = new Set(prev.map((u) => u.id));
      for (const u of nextUsersFromTable) {
        if (!prevIds.has(u.id)) {
          merged.push(u);
        }
      }

      return merged;
    });
  };

  // Filter users by role
  const filteredUsers = selectedRole === 'all' 
    ? users 
    : users.filter(user => user.role === selectedRole);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#262626] dark:text-white">
            {dictionary.users.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{dictionary.users.userList}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/dashboard/roles`}>
            <Button 
              variant="outline"
              className="h-11 border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] text-[#262626] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
            >
              <Shield className="mr-2 h-4 w-4" />
              {dictionary.nav.roles}
            </Button>
          </Link>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="h-11 bg-[#262626] dark:bg-white text-white dark:text-[#262626] hover:bg-[#1a1a1a] dark:hover:bg-gray-100 border-2 border-transparent"
          >
            <Plus className="mr-2 h-4 w-4" />
            {dictionary.users.createUser}
          </Button>
        </div>
      </div>

      {/* Role Filter */}
      <div className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-10 w-10 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-gray-50 dark:bg-[#1a1a1a] flex items-center justify-center">
              <Shield className="h-5 w-5 text-[#262626] dark:text-white" />
            </div>
            <span className="text-base font-bold text-[#262626] dark:text-white">{filterLabel}</span>
          </div>

          <div className="flex flex-wrap gap-2 flex-1">
            {roleOptions.map((opt) => {
              const active = selectedRole === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setSelectedRole(opt.key)}
                  className={
                    "px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors active:scale-[0.99] border-2 " +
                    (active
                      ? `bg-gray-50 dark:bg-[#1a1a1a] ${opt.accentClass}`
                      : "bg-white dark:bg-[#262626] text-gray-700 dark:text-gray-300 border-[#DDDDDD] dark:border-[#000000] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]")
                  }
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    {opt.label}
                    <span
                      className={
                        "px-2 py-0.5 rounded-full text-xs font-bold border " +
                        (active
                          ? "bg-transparent border-current text-current"
                          : "bg-gray-100 dark:bg-[#1a1a1a] border-[#DDDDDD] dark:border-[#000000] text-gray-700 dark:text-gray-300")
                      }
                    >
                      {opt.count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <UsersTable
        key={selectedRole}
        users={filteredUsers}
        dictionary={dictionary}
        onUsersChange={handleUsersChange}
        locale={locale}
      />

      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        dictionary={dictionary}
        locale={locale}
        onUserCreated={(newUser: User) => {
          setUsers((prev) => [...prev, newUser]);
        }}
      />
    </div>
  );
}
