'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { Bell, Download, LogOut, Sparkles, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="relative z-50 backdrop-blur-2xl bg-linear-to-r from-black/95 via-gray-900/95 to-black/95 border-b-2 border-white/10"
    >
      {/* Animated gradient overlay */}
      <motion.div 
        className="absolute inset-0 bg-linear-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundSize: '200% 100%',
        }}
      />

      {/* Glow effect on top border */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-blue-500 to-transparent"
        animate={{
          opacity: [0.3, 0.8, 0.3],
          scaleX: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <div className="flex h-20 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto relative z-10 gap-4">
        {/* Logo & Title */}
        <Link href={`/${locale}`} className="flex items-center gap-3 group h-14">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <img 
              src="/logo-white.png" 
              alt="DNA Logo" 
              className="h-18 w-auto object-contain drop-shadow-2xl"
            />
          </motion.div>
          
          <motion.h1
            className="hidden sm:block text-2xl font-black bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
            whileHover={{ scale: 1.05 }}
          >
            {dictionary.common.appName}
          </motion.h1>
        </Link>

        {/* Primary Nav (desktop) */}
        <nav className="hidden md:flex items-center gap-2 flex-1 justify-center">
          {[
            { href: `/${locale}`, label: dictionary.nav.home, active: pathname === `/${locale}` },
            { href: `/${locale}/about`, label: dictionary.nav.about, active: pathname?.startsWith(`/${locale}/about`) },
            { href: `/${locale}/contact`, label: dictionary.nav.contact, active: pathname?.startsWith(`/${locale}/contact`) },
          ].map((item) => (
            <motion.div key={item.href} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href={item.href}
                className={
                  "relative inline-flex items-center gap-2 rounded-2xl px-4 h-11 text-sm font-bold transition-all border " +
                  (item.active
                    ? "bg-white/12 border-white/25 text-white shadow-lg shadow-blue-500/15"
                    : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white/80")
                }
              >
                {item.active && (
                  <motion.span
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 rounded-2xl bg-linear-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20"
                  />
                )}
                <span className="relative z-10">{item.label}</span>
                {item.active && (
                  <motion.span
                    className="relative z-10"
                    animate={{ rotate: [0, -8, 8, -8, 0] }}
                    transition={{ duration: 0.7 }}
                  >
                    <Sparkles className="h-4 w-4 text-purple-300" />
                  </motion.span>
                )}
              </Link>
            </motion.div>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          {/* Install App Button */}
          {installPrompt && (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleInstall}
                className="h-11 w-11 rounded-xl bg-green-500/10 hover:bg-green-500/20 border-2 border-green-500/30 hover:border-green-500/50 transition-all"
                title={dictionary.common.installApp}
              >
                <motion.div
                  animate={{
                    y: [0, -3, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                >
                  <Download className="h-5 w-5 text-green-400" />
                </motion.div>
                <span className="sr-only">{dictionary.common.installApp}</span>
              </Button>
            </motion.div>
          )}

          {/* Show notifications only for logged-in users */}
          {user && (
            <Link href={`/${locale}/dashboard/notifications`}>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-xl bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-white/20 transition-all relative group"
                  title={dictionary.nav.notifications}
                >
                  <motion.div
                    animate={{
                      rotate: [0, -15, 15, -15, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                  >
                    <Bell className="h-5 w-5 text-blue-400 group-hover:text-blue-300" />
                  </motion.div>
                  {/* Notification pulse indicator */}
                  <motion.span
                    className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [1, 0.7, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                  <span className="sr-only">{dictionary.nav.notifications}</span>
                </Button>
              </motion.div>
            </Link>
          )}

          {/* User Menu or Login Button */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full border-2 border-white/20 hover:border-white/40 bg-linear-to-br from-blue-600 to-purple-600 relative overflow-hidden group">
                    {/* Animated gradient overlay */}
                    <motion.div
                      className="absolute inset-0 bg-linear-to-br from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100"
                      transition={{ duration: 0.3 }}
                    />
                    <div className="relative z-10 h-9 w-9 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white text-sm font-black border border-white/20">
                      {user.fullName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="sr-only">User menu</span>
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-72 bg-gray-950/90 backdrop-blur-2xl border-2 border-white/10 shadow-2xl shadow-purple-900/30 overflow-hidden"
              >
                {/* Decorative layers */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.16),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.16),transparent_60%)]" />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-size-[24px_24px] opacity-[0.08]" />

                <DropdownMenuLabel className="relative bg-linear-to-br from-blue-600/25 to-purple-600/25 border-b border-white/10">
                  <div className="flex flex-col space-y-1 p-2">
                    <span className="text-sm font-bold text-white">
                      {user.fullName || dictionary.common.welcome}
                    </span>
                    <span className="text-xs text-gray-400">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                
                {/* Dashboard Link */}
                {user.role && user.role !== 'player' && (
                  <>
                    <Link href={`/${locale}/dashboard`}>
                      <DropdownMenuItem className="cursor-pointer hover:bg-white/10 focus:bg-white/10 text-white relative">
                        <User className="mr-2 h-4 w-4 text-blue-400" />
                        <span className="font-medium">{dictionary.nav.dashboard}</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator className="bg-white/10" />
                  </>
                )}
                
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-300 hover:bg-red-500/20 focus:bg-red-500/20 font-medium">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{dictionary.common.logout}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href={`/${locale}/auth/login`}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="h-11 px-8 rounded-xl bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold border-2 border-white/20 shadow-lg shadow-purple-500/50 relative overflow-hidden group">
                  <motion.span
                    className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0"
                    animate={{
                      x: ['-200%', '200%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  />
                  <span className="relative z-10">{dictionary.common.login}</span>
                </Button>
              </motion.div>
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
}