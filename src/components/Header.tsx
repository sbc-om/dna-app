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
    <header className="sticky top-0 z-40 border-b-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Logo & Title */}
        <Link href={`/${locale}`} className="flex items-center gap-3 group">
          <div className="p-1.5 bg-white dark:bg-[#262626] rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000]">
            <img 
              src="/logo.png" 
              alt="DNA Logo" 
              className="h-7 w-7 object-contain"
            />
          </div>
          <h1 className="hidden sm:block text-xl font-bold text-[#262626] dark:text-white">
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
              className="h-10 w-10 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-colors border-2 border-transparent hover:border-black/10 dark:hover:border-white/10"
              title="Install App"
            >
              <Download className="h-5 w-5 text-green-600 dark:text-green-500" />
              <span className="sr-only">Install App</span>
            </Button>
          )}

          {/* Show notifications and dashboard link only for logged-in users */}
          {user && (
            <>
              <Link href={`/${locale}/dashboard/notifications`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-colors border-2 border-transparent hover:border-black/10 dark:hover:border-white/10 relative"
                  title={dictionary.nav.notifications}
                >
                  <Bell className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                  <span className="sr-only">{dictionary.nav.notifications}</span>
                </Button>
              </Link>
            </>
          )}

          {/* User Menu or Login Button */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full active:scale-95 transition-colors border-2 border-transparent hover:border-black/10 dark:hover:border-white/10">
                  <div className="h-8 w-8 rounded-full bg-[#262626] dark:bg-[#262626] flex items-center justify-center text-white text-sm font-bold border-2 border-[#DDDDDD] dark:border-[#000000]">
                    {user.fullName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
                <DropdownMenuLabel className="bg-gray-50 dark:bg-[#1a1a1a]">
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-bold text-[#262626] dark:text-white">
                      {user.fullName || dictionary.common.welcome}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#DDDDDD] dark:bg-[#000000]" />
                
                {/* Dashboard Link */}
                {user.role && user.role !== 'kid' && (
                  <>
                    <Link href={`/${locale}/dashboard`}>
                      <DropdownMenuItem className="cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 focus:bg-black/5 dark:focus:bg-white/5">
                        <User className="mr-2 h-4 w-4 text-gray-700 dark:text-gray-200" />
                        <span className="font-medium">{dictionary.nav?.dashboard || 'Dashboard'}</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator className="bg-[#DDDDDD] dark:bg-[#000000]" />
                  </>
                )}
                
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 focus:bg-red-50 dark:focus:bg-red-950/20 font-medium">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{dictionary.common.logout}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href={`/${locale}/auth/login`}>
              <Button className="h-10 px-6 bg-[#262626] hover:bg-black text-white font-semibold active:scale-95 transition-colors border-2 border-[#262626]">
                {dictionary.common.login}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}