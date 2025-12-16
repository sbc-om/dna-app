'use client';

import { LogOut, User, Menu, X, Download, Bell, Globe, Building2, ChevronDown } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { getUnreadCountAction } from '@/lib/actions/notificationActions';
import { getMyAcademiesAction, setCurrentAcademyAction } from '@/lib/actions/academyActions';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface DashboardHeaderProps {
  dictionary: Dictionary;
  user: {
    fullName?: string;
    email: string;
    profilePicture?: string;
  };
  onMobileMenuToggle?: () => void;
}

export function DashboardHeader({ dictionary, user, onMobileMenuToggle }: DashboardHeaderProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as Locale) || 'en';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [academies, setAcademies] = useState<Array<{ id: string; name: string }>>([]);
  const [currentAcademyId, setCurrentAcademyId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const result = await getUnreadCountAction();
      if (result.success) {
        setUnreadCount(result.count);
      }
    };

    fetchUnreadCount();
    // Poll every minute
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadAcademies = async () => {
      try {
        const result = await getMyAcademiesAction(locale);
        if (result.success) {
          const list = (result.academies || []) as Array<{ id: string; name: string }>;
          setAcademies(list);
          setCurrentAcademyId((result as any).currentAcademyId || null);
        }
      } catch (e) {
        console.error('Failed to load academies:', e);
      }
    };

    loadAcademies();
  }, [locale]);

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

  const handleLogout = async () => {
    try {
      console.log('🔓 Logging out...');
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        console.log('✅ Logout successful, redirecting...');
        router.push(`/${locale}/auth/login`);
        router.refresh();
      } else {
        console.error('❌ Logout failed:', await response.text());
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (onMobileMenuToggle) {
      onMobileMenuToggle();
    }
  };

  const handleInstall = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
    }
    
    setInstallPrompt(null);
  };

  const currentAcademyName = academies.find((a) => a.id === currentAcademyId)?.name || (academies[0]?.name ?? 'Academy');

  const handleSwitchAcademy = async (academyId: string) => {
    try {
      const result = await setCurrentAcademyAction(locale, academyId);
      if (result.success) {
        setCurrentAcademyId(academyId);
        router.refresh();
      } else {
        console.error(result.error || 'Failed to switch academy');
      }
    } catch (e) {
      console.error('Failed to switch academy:', e);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a]">
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 lg:px-6 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMobileMenuToggle}
            className="lg:hidden h-10 w-10 min-w-10 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-colors border-2 border-transparent hover:border-black/10 dark:hover:border-white/10 touch-manipulation"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5 text-gray-800 dark:text-gray-100" />
            ) : (
              <Menu className="h-5 w-5 text-gray-800 dark:text-gray-100" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>

          {/* Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">

            <h1 className="hidden sm:block text-base md:text-lg lg:text-xl font-bold text-[#262626] dark:text-white truncate">
              Discover Natural Ability
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Home Button */}
          <Link href={`/${locale}`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 min-w-9 sm:min-w-10 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-colors border-2 border-transparent hover:border-black/10 dark:hover:border-white/10 touch-manipulation"
              title={dictionary.nav?.home || 'Home'}
            >
              <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-200" />
              <span className="sr-only">{dictionary.nav?.home || 'Home'}</span>
            </Button>
          </Link>

          {/* Academy Switcher */}
          {academies.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-colors border-2 border-transparent hover:border-black/10 dark:hover:border-white/10 touch-manipulation flex items-center gap-2"
                  title="Switch academy"
                >
                  <Building2 className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                  <span className="hidden md:inline max-w-[180px] truncate font-semibold text-[#262626] dark:text-white">{currentAcademyName}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
                <DropdownMenuLabel className="bg-gray-50 dark:bg-[#1a1a1a]">
                  <span className="text-sm font-bold text-[#262626] dark:text-white">Academies</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#DDDDDD] dark:bg-[#000000]" />
                {academies.map((a) => (
                  <DropdownMenuItem
                    key={a.id}
                    onClick={() => handleSwitchAcademy(a.id)}
                    className="cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 focus:bg-black/5 dark:focus:bg-white/5"
                  >
                    <div className="flex items-center justify-between w-full gap-3">
                      <span className="font-medium text-[#262626] dark:text-white truncate">{a.name}</span>
                      {a.id === currentAcademyId && (
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Current</span>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <ThemeToggle />
          <LanguageSwitcher />

          {/* Install App Button */}
          {installPrompt && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleInstall}
              className="h-9 w-9 sm:h-10 sm:w-10 min-w-9 sm:min-w-10 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-colors border-2 border-transparent hover:border-black/10 dark:hover:border-white/10 touch-manipulation"
              title="Install App"
            >
              <Download className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-500" />
              <span className="sr-only">Install App</span>
            </Button>
          )}

          {/* Notifications Button */}
          <Link href={`/${locale}/dashboard/notifications`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 min-w-9 sm:min-w-10 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-colors border-2 border-transparent hover:border-black/10 dark:hover:border-white/10 touch-manipulation relative"
              title={dictionary.nav.notifications}
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-200" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-600 border-2 border-white dark:border-[#1a1a1a]" />
              )}
              <span className="sr-only">{dictionary.nav.notifications}</span>
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 min-w-9 sm:min-w-10 rounded-full active:scale-95 transition-colors touch-manipulation border-2 border-transparent hover:border-black/10 dark:hover:border-white/10">
                {user.profilePicture ? (
                  <img
                    key={user.profilePicture}
                    src={user.profilePicture}
                    alt={user.fullName || 'User'}
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover border-2 border-[#DDDDDD] dark:border-[#000000]"
                  />
                ) : (
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[#262626] dark:bg-[#262626] flex items-center justify-center text-white text-xs sm:text-sm font-bold border-2 border-[#DDDDDD] dark:border-[#000000]">
                    {user.fullName?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
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
              <Link href={`/${locale}/dashboard/profile`}>
                <DropdownMenuItem className="cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 focus:bg-black/5 dark:focus:bg-white/5">
                  <User className="mr-2 h-4 w-4 text-gray-700 dark:text-gray-200" />
                  <span className="font-medium">{dictionary.users?.profile || 'My Profile'}</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator className="bg-[#DDDDDD] dark:bg-[#000000]" />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 focus:bg-red-50 dark:focus:bg-red-950/20 font-medium">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{dictionary.common.logout}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
