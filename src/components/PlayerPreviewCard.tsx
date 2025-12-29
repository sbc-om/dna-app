'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, IdCard, UserCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Locale } from '@/config/i18n';
import type { User as UserType } from '@/lib/db/repositories/userRepository';
import { cn } from '@/lib/utils';

export type PlayerPreviewCardProps = {
  locale: Locale;
  dictionary: Dictionary;
  child: UserType;
  className?: string;
};

const getDisplayedBirthDate = (user: Partial<UserType> & { dateOfBirth?: string }): string | undefined => {
  return (user as any)?.birthDate ?? (user as any)?.dateOfBirth;
};

export function PlayerPreviewCard({ locale, dictionary, child, className }: PlayerPreviewCardProps) {
  const birthDate = getDisplayedBirthDate(child as any);

  return (
    <Link href={`/${locale}/dashboard/players/${child.id}`} className={cn('block', className)}>
      <motion.div whileHover={{ y: -4, scale: 1.01 }} whileTap={{ scale: 0.98 }}>
        <Card className={cn(
          'relative overflow-hidden rounded-2xl bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] shadow-lg',
          'transition-shadow hover:shadow-xl',
        )}>
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -top-24 -right-28 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-28 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
          </div>

          <div className="relative p-5 border-b-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-r from-blue-600 via-purple-600 to-pink-600">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 rounded-2xl overflow-hidden bg-white/15 border-2 border-white/20 shadow-lg flex items-center justify-center shrink-0">
                  {child.profilePicture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={child.profilePicture}
                      alt={child.fullName || child.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircle2 className="h-7 w-7 text-white/90" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-lg font-extrabold text-white truncate">
                    {child.fullName || child.username}
                  </div>
                  <div className="text-xs font-semibold text-white/80 truncate">
                    @{child.username}
                  </div>
                </div>
              </div>

              <div className="h-10 w-10 rounded-2xl border-2 border-white/20 bg-white/10" aria-hidden />
            </div>
          </div>

          <div className="relative p-5">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-start gap-3 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-gray-50 dark:bg-[#1a1a1a] p-4">
                <div className="h-10 w-10 rounded-xl bg-white dark:bg-[#0a0a0a] border-2 border-[#DDDDDD] dark:border-[#000000] flex items-center justify-center shrink-0">
                  <IdCard className="h-5 w-5 text-[#262626] dark:text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {dictionary.users?.nationalId || 'National ID'}
                  </div>
                  <div className="text-sm font-extrabold text-[#262626] dark:text-white truncate">
                    {child.nationalId || child.username}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-gray-50 dark:bg-[#1a1a1a] p-4">
                <div className="h-10 w-10 rounded-xl bg-white dark:bg-[#0a0a0a] border-2 border-[#DDDDDD] dark:border-[#000000] flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-[#262626] dark:text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {dictionary.dashboard?.academyAdmin?.birthDate || dictionary.playerProfile?.labels?.birthDate || 'Birth date'}
                  </div>
                  <div className="text-sm font-extrabold text-[#262626] dark:text-white truncate">
                    {birthDate
                      ? new Date(birthDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')
                      : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}
