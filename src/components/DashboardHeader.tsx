'use client';

import { LogOut, User, Menu, X, Download, Bell, Globe } from 'lucide-react';
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

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-xl dark:bg-gray-900/95 shadow-sm">
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 lg:px-6 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMobileMenuToggle}
            className="lg:hidden h-10 w-10 min-w-10 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 active:scale-95 transition-transform touch-manipulation"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5 text-purple-600" />
            ) : (
              <Menu className="h-5 w-5 text-purple-600" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>

          {/* Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img 
              src="/logo.png" 
              alt="DNA Logo" 
              className="h-7 w-7 sm:h-8 sm:w-8 object-contain shrink-0"
            />
            <h1 className="hidden sm:block text-base md:text-lg lg:text-xl font-bold text-[#FF5F02] truncate">
              Discover Natural Ability
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* View Website Button - Hidden on very small screens */}
          <Link href={`/${locale}`} className="hidden xs:inline-flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 min-w-9 sm:min-w-10 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 active:scale-95 transition-transform touch-manipulation"
              title="View Website"
            >
              <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              <span className="sr-only">View Website</span>
            </Button>
          </Link>

          <ThemeToggle />
          <LanguageSwitcher />

          {/* Install App Button */}
          {installPrompt && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleInstall}
              className="h-9 w-9 sm:h-10 sm:w-10 min-w-9 sm:min-w-10 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 active:scale-95 transition-transform touch-manipulation"
              title="Install App"
            >
              <Download className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              <span className="sr-only">Install App</span>
            </Button>
          )}

          {/* Notifications Button */}
          <Link href={`/${locale}/dashboard/notifications`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 min-w-9 sm:min-w-10 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 active:scale-95 transition-transform touch-manipulation relative"
              title={dictionary.nav.notifications}
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-500 border-2 border-white dark:border-gray-900 animate-pulse" />
              )}
              <span className="sr-only">{dictionary.nav.notifications}</span>
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 min-w-9 sm:min-w-10 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/20 active:scale-95 transition-transform touch-manipulation">
                {user.profilePicture ? (
                  <img
                    key={user.profilePicture}
                    src={user.profilePicture}
                    alt={user.fullName || 'User'}
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover shadow-lg border-2 border-purple-600"
                  />
                ) : (
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[#FF5F02] flex items-center justify-center text-white text-xs sm:text-sm font-semibold shadow-lg">
                    {user.fullName?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
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
              <Link href={`/${locale}/dashboard/profile`}>
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>{dictionary.users?.profile || 'My Profile'}</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
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
