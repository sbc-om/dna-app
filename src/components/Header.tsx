'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { Bell } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  dictionary: Dictionary;
  locale: Locale;
}

export function Header({ dictionary, locale }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-24 items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center space-x-3">
          <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-[#F2574C] via-[#30B2D2] to-[#E8A12D] bg-clip-text text-transparent">
            DNA
          </div>
        </Link>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href={`/${locale}/notifications`}>
            <Button variant="ghost" size="lg" className="relative p-6">
              <Bell className="text-[#F2574C]" style={{ width: '36px', height: '36px' }} />
            </Button>
          </Link>
          <LanguageSwitcher />
        </div>

        {/* Mobile Actions */}
        <div className="flex md:hidden items-center space-x-3">
          <Link href={`/${locale}/notifications`}>
            <Button variant="ghost" size="lg" className="relative p-6">
              <Bell className="text-[#F2574C]" style={{ width: '36px', height: '36px' }} />
            </Button>
          </Link>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}