'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { Bell, Download, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface HeaderProps {
  dictionary: Dictionary;
  locale: Locale;
  user?: {
    fullName?: string;
    email: string;
    role?: string;
  } | null;
}

export function Header({ dictionary, locale, user }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Don't prevent default - browser will handle it if we don't show custom UI
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
    }
    
    setInstallPrompt(null);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push(`/${locale}/auth/login`);
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-white dark:bg-[#262626] shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Logo & Title */}
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="DNA Logo" 
            className="h-8 w-8 object-contain"
          />
          <h1 className="hidden sm:block text-xl font-bold text-[#FF5F02]">
            Discover Natural Ability
          </h1>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <LanguageSwitcher />

          {/* Install App Button */}
          {installPrompt && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleInstall}
              className="h-10 w-10 rounded-lg hover:bg-[#DDDDDD] text-[#FF5F02]"
              title="Install App"
            >
              <Download className="h-5 w-5" />
              <span className="sr-only">Install App</span>
            </Button>
          )}

          {/* Notifications Button */}
          <Link href={`/${locale}/dashboard/notifications`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-lg hover:bg-[#DDDDDD] text-[#FF5F02] relative"
              title={dictionary.nav.notifications}
            >
              <Bell className="h-5 w-5" />
              <span className="sr-only">{dictionary.nav.notifications}</span>
            </Button>
          </Link>

          {/* User Menu or Login Button */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-[#DDDDDD]">
                  <div className="h-8 w-8 rounded-full bg-[#FF5F02] flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                    {user.fullName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-semibold">
                      {user.fullName || dictionary.common.welcome}
                    </span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Dashboard Links */}
                {user.role && user.role !== 'kid' && (
                  <>
                    <Link href={`/${locale}/dashboard`}>
                      <DropdownMenuItem className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>{dictionary.nav?.dashboard || 'Dashboard'}</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                  </>
                )}
                
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{dictionary.common.logout}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href={`/${locale}/auth/login`}>
              <Button className="bg-[#FF5F02] hover:bg-[#262626] text-white">
                {dictionary.common.login}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}