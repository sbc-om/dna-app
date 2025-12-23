'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AtSign,
  Building2,
  Calendar,
  Hash,
  Mail,
  Phone,
  Shield,
  UserCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { EditUserDialog } from '@/components/EditUserDialog';

import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Locale } from '@/config/i18n';
import type { User } from '@/lib/db/repositories/userRepository';

export type UserAcademyMembershipView = {
  academyId: string;
  academyName: string;
  academyNameAr: string;
  academyIsActive: boolean;
  memberRole: string;
};

interface UserDetailsClientProps {
  dictionary: Dictionary;
  locale: Locale;
  user: User;
  memberships: UserAcademyMembershipView[];
  children?: User[];
  parents?: User[];
  kids?: User[];
}

function formatDate(locale: Locale, iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(locale === 'ar' ? 'ar' : 'en', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export function UserDetailsClient({ dictionary, locale, user, memberships, children, parents = [], kids = [] }: UserDetailsClientProps) {
  const [editingOpen, setEditingOpen] = useState(false);
  const [localUser, setLocalUser] = useState<User>(user);

  const displayName = localUser.fullName || localUser.username || localUser.email;
  const roleLabel = dictionary.users.roles?.[localUser.role] || localUser.role;

  const avatarFallback = useMemo(() => {
    const c = (displayName || 'U').trim().charAt(0).toUpperCase();
    return c || 'U';
  }, [displayName]);

  const showChildren = localUser.role === 'parent' && Array.isArray(children);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#262626] dark:text-white truncate">
                {displayName}
              </h1>
              <Badge
                variant="outline"
                className="border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-200 font-semibold"
              >
                {String(roleLabel).toUpperCase()}
              </Badge>
              <Badge
                variant={localUser.isActive ? 'default' : 'secondary'}
                className={
                  localUser.isActive
                    ? 'bg-green-600/10 text-green-700 dark:text-green-400 border border-green-600/30'
                    : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 border border-[#DDDDDD] dark:border-[#000000]'
                }
              >
                {localUser.isActive ? dictionary.users.active : dictionary.users.inactive}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {dictionary.users.userProfileSubtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setEditingOpen(true)}
            className="h-11 border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626]"
          >
            {dictionary.common.edit}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary */}
        <Card className="lg:col-span-1 bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] shadow-lg overflow-hidden">
          <CardHeader className="bg-gray-50 dark:bg-[#1a1a1a] border-b-2 border-[#DDDDDD] dark:border-[#000000]">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#0a0a0a] overflow-hidden flex items-center justify-center">
                {localUser.profilePicture ? (
                  <Image
                    src={localUser.profilePicture}
                    alt={displayName}
                    width={56}
                    height={56}
                    className="h-14 w-14 object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-[#262626] dark:bg-white text-white dark:text-[#262626] flex items-center justify-center font-bold text-xl">
                    {avatarFallback}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <CardTitle className="text-xl font-bold text-[#262626] dark:text-white truncate">
                  {displayName}
                </CardTitle>
                <CardDescription className="truncate">
                  {dictionary.users.userProfileTitle}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-[#262626] dark:text-white mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">{dictionary.common.email}</p>
                  <p className="text-sm font-semibold text-[#262626] dark:text-white wrap-break-word">{localUser.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-[#262626] dark:text-white mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">{dictionary.common.phoneNumber}</p>
                  <p className="text-sm font-semibold text-[#262626] dark:text-white wrap-break-word">{localUser.phoneNumber || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AtSign className="h-5 w-5 text-[#262626] dark:text-white mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">{dictionary.common.username}</p>
                  <p className="text-sm font-semibold text-[#262626] dark:text-white wrap-break-word">{localUser.username}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-[#262626] dark:text-white mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">{dictionary.users.userId}</p>
                  <p className="text-sm font-semibold text-[#262626] dark:text-white wrap-break-word">{localUser.id}</p>
                </div>
              </div>
            </div>

            <Separator className="bg-[#DDDDDD] dark:bg-[#000000]" />

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] p-3 bg-white dark:bg-[#1a1a1a]">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>{dictionary.users.createdAt}</span>
                </div>
                <p className="mt-1 text-sm font-bold text-[#262626] dark:text-white">{formatDate(locale, localUser.createdAt)}</p>
              </div>
              <div className="rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] p-3 bg-white dark:bg-[#1a1a1a]">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>{dictionary.users.updatedAt}</span>
                </div>
                <p className="mt-1 text-sm font-bold text-[#262626] dark:text-white">{formatDate(locale, localUser.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] shadow-lg overflow-hidden">
            <CardHeader className="bg-gray-50 dark:bg-[#1a1a1a] border-b-2 border-[#DDDDDD] dark:border-[#000000]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
                  <Shield className="h-5 w-5 text-[#262626] dark:text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-[#262626] dark:text-white">{dictionary.users.accountInformation}</CardTitle>
                  <CardDescription>{dictionary.users.userDetails}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] p-4 bg-white dark:bg-[#1a1a1a]">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#262626] dark:text-white">
                    <UserCircle className="h-5 w-5" />
                    <span>{dictionary.users.role}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{roleLabel}</p>
                </div>

                <div className="rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] p-4 bg-white dark:bg-[#1a1a1a]">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#262626] dark:text-white">
                    <Shield className="h-5 w-5" />
                    <span>{dictionary.users.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {localUser.isActive ? dictionary.users.active : dictionary.users.inactive}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] shadow-lg overflow-hidden">
            <CardHeader className="bg-gray-50 dark:bg-[#1a1a1a] border-b-2 border-[#DDDDDD] dark:border-[#000000]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-[#262626] dark:text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-[#262626] dark:text-white">{dictionary.users.academyMemberships}</CardTitle>
                  <CardDescription>{dictionary.users.academyMembershipsHint}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {memberships.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-[#DDDDDD] dark:border-[#000000] p-6 text-center text-sm text-gray-600 dark:text-gray-400">
                  {dictionary.users.noAcademyMemberships}
                </div>
              ) : (
                <div className="space-y-3">
                  {memberships.map((m) => (
                    <div
                      key={`${m.academyId}:${m.memberRole}`}
                      className="p-4 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[#262626] dark:text-white truncate">
                          {locale === 'ar' ? m.academyNameAr : m.academyName}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{m.academyId}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className="border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] text-gray-800 dark:text-gray-200 font-semibold"
                        >
                          {String(m.memberRole).toUpperCase()}
                        </Badge>
                        <Badge
                          variant={m.academyIsActive ? 'default' : 'secondary'}
                          className={
                            m.academyIsActive
                              ? 'bg-green-600/10 text-green-700 dark:text-green-400 border border-green-600/30'
                              : 'bg-gray-100 dark:bg-[#0a0a0a] text-gray-700 dark:text-gray-300 border border-[#DDDDDD] dark:border-[#000000]'
                          }
                        >
                          {m.academyIsActive ? dictionary.users.academyActive : dictionary.users.academyInactive}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {showChildren && (
            <Card className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] shadow-lg overflow-hidden">
              <CardHeader className="bg-gray-50 dark:bg-[#1a1a1a] border-b-2 border-[#DDDDDD] dark:border-[#000000]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
                    <UserCircle className="h-5 w-5 text-[#262626] dark:text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-[#262626] dark:text-white">{dictionary.users.children}</CardTitle>
                    <CardDescription>{dictionary.users.childrenHint}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {children!.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-[#DDDDDD] dark:border-[#000000] p-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    {dictionary.users.noChildren}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {children!.map((kid) => (
                      <Link
                        key={kid.id}
                        href={`/${locale}/dashboard/kids/${kid.id}`}
                        className="block"
                      >
                        <div className="p-4 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#0a0a0a] transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-[#262626] dark:text-white truncate">
                                {kid.fullName || kid.username}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{kid.nationalId || kid.id}</p>
                            </div>
                            <Badge
                              variant={kid.isActive ? 'default' : 'secondary'}
                              className={
                                kid.isActive
                                  ? 'bg-green-600/10 text-green-700 dark:text-green-400 border border-green-600/30'
                                  : 'bg-gray-100 dark:bg-[#0a0a0a] text-gray-700 dark:text-gray-300 border border-[#DDDDDD] dark:border-[#000000]'
                              }
                            >
                              {kid.isActive ? dictionary.users.active : dictionary.users.inactive}
                            </Badge>
                          </div>
                          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-semibold">{dictionary.users.createdAt}:</span> {formatDate(locale, kid.createdAt)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <EditUserDialog
        user={localUser}
        open={editingOpen}
        onOpenChange={setEditingOpen}
        dictionary={dictionary}
        locale={locale}
        parents={parents}
        kids={kids}
        onUserUpdated={(u) => setLocalUser(u)}
      />
    </div>
  );
}
