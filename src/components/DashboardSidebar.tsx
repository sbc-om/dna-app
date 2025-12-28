'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  Building2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Settings,
  BookOpen,
  DollarSign,
  MessageCircle,
  
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { useState, useEffect } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface MenuItem {
  key: string;
  resourceKey: string;
  labelKey: keyof Dictionary['nav'];
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    resourceKey: 'dashboard',
    labelKey: 'dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    key: 'users',
    resourceKey: 'dashboard.users',
    labelKey: 'users',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    key: 'roles',
    resourceKey: 'dashboard.roles',
    labelKey: 'roles',
    href: '/dashboard/roles',
    icon: Shield,
  },
  {
    key: 'academies',
    resourceKey: 'dashboard.academies',
    labelKey: 'academies',
    href: '/dashboard/academies',
    icon: Building2,
  },
  {
    key: 'messages',
    resourceKey: 'dashboard.messages',
    labelKey: 'messages',
    href: '/dashboard/messages',
    icon: MessageSquare,
  },
  {
    key: 'whatsapp',
    resourceKey: 'dashboard.whatsapp',
    labelKey: 'whatsapp',
    href: '/dashboard/whatsapp',
    icon: MessageCircle,
  },
  {
    key: 'settings',
    resourceKey: 'dashboard.settings',
    labelKey: 'settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export interface DashboardSidebarProps {
  dictionary: Dictionary;
  accessibleResources: string[];
  locale: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface SidebarContentProps {
  isCollapsed: boolean;
  locale: string;
  pathname: string;
  filteredMenuItems: MenuItem[];
  dictionary: Dictionary;
  onMobileClose?: () => void;
  isRTL: boolean;
}

const SidebarContent = ({
  isCollapsed,
  locale,
  pathname,
  filteredMenuItems,
  dictionary,
  onMobileClose,
  isRTL
}: SidebarContentProps) => (
  <div className="flex flex-col h-full relative overflow-hidden">
    {/* Animated Background Gradient */}
    <div className="absolute inset-0 bg-linear-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5 animate-pulse animation-duration-[8s]" />
    
    {/* Logo/Brand - Hidden on mobile */}
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "hidden lg:block p-6 border-b border-white/10 relative z-10 backdrop-blur-sm",
        isCollapsed && "lg:px-3"
      )}
    >
      <Link href={`/${locale}/dashboard`} className={cn(
        "flex items-center gap-3 group relative",
        isCollapsed && "lg:justify-center"
      )}>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="shrink-0 relative"
        >
          <img 
            src="/logo-white.png" 
            alt="DNA Logo" 
            className="h-16 w-auto object-contain"
          />
        </motion.div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1 min-w-0"
            >
              <h2 className="text-xl font-bold truncate bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                DNA
              </h2>
              <p className="text-xs font-medium text-white/60 truncate">Discover Natural Ability</p>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>
    </motion.div>

    {/* Navigation */}
    <OverlayScrollbarsComponent
      element="nav"
      className="flex-1 min-h-0 p-4 relative z-10"
      options={{
        scrollbars: {
          theme: 'os-theme-dark',
          visibility: 'auto',
          autoHide: 'move',
          autoHideDelay: 800,
        },
        overflow: {
          x: 'hidden',
          y: 'scroll'
        }
      }}
      defer
    >
      <div className="flex flex-col gap-2">
        {filteredMenuItems.map((item, index) => {
          const Icon = item.icon;
          const href = `/${locale}${item.href}`;
          const isActive = item.key === 'dashboard'
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          
          return (
            <motion.div 
              key={item.key} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative group/item"
            >
              <Link
                href={href}
                onClick={() => onMobileClose && onMobileClose()}
                className="block relative"
              >
                <motion.div
                  whileHover={{ scale: 1.02, x: isRTL ? -4 : 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 backdrop-blur-sm relative overflow-hidden",
                    "min-h-12",
                    isActive 
                      ? "bg-linear-to-r from-blue-600/20 to-purple-600/20 text-white border-2 border-blue-500/50 shadow-lg shadow-blue-500/20"
                      : "text-white/70 hover:text-white hover:bg-white/5 border-2 border-white/5 hover:border-white/10",
                    isCollapsed && "lg:justify-center lg:px-3"
                  )}
                >
                  {/* Active indicator glow */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className={cn(
                        "absolute top-0 bottom-0 w-1 bg-linear-to-b from-blue-400 via-purple-500 to-pink-500",
                        isRTL ? "right-0 rounded-l-full" : "left-0 rounded-r-full"
                      )}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  
                  {/* Icon with glow effect */}
                  <motion.div 
                    className="relative"
                    animate={isActive ? { 
                      rotate: [0, -5, 5, -5, 0],
                    } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className={cn(
                      "h-5 w-5 shrink-0 relative z-10",
                      isActive && "drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                    )} />
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-50"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                  
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span 
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="font-medium truncate flex-1 text-[15px]"
                      >
                        {dictionary.nav[item.labelKey]}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </OverlayScrollbarsComponent>

    {/* Footer */}
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 border-t border-white/10 relative z-10 backdrop-blur-sm",
        isCollapsed && "lg:px-2"
      )}
    >
      <div className={cn(
        "text-xs text-center text-white/50",
        isCollapsed && "lg:hidden"
      )}>
        <p>© 2025 DNA</p>
        <p className="mt-1 font-mono">v1.0.0</p>
      </div>
      {isCollapsed && (
        <div className="hidden lg:block text-xs text-center text-white/50 font-mono">
          v1.0
        </div>
      )}
    </motion.div>
  </div>
);

export function DashboardSidebar({ 
  dictionary, 
  accessibleResources,
  locale,
  isMobileOpen = false,
  onMobileClose
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isRTL = locale === 'ar';

  // Close mobile menu when route changes
  useEffect(() => {
    if (onMobileClose && isMobileOpen) {
      onMobileClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const filteredMenuItems = menuItems.filter(item =>
    item.resourceKey === 'dashboard' || accessibleResources.includes(item.resourceKey)
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col bg-linear-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460] border-white/10 transition-all duration-500 relative shadow-2xl",
        isRTL ? "border-l" : "border-r",
        isCollapsed ? "w-20" : "w-72"
      )}>
        {/* Animated mesh gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)] opacity-50" />
        
        <SidebarContent 
          isCollapsed={isCollapsed}
          locale={locale}
          pathname={pathname}
          filteredMenuItems={filteredMenuItems}
          dictionary={dictionary}
          onMobileClose={onMobileClose}
          isRTL={isRTL}
        />
        
        {/* Collapse Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute top-20 -right-3 h-8 w-8 rounded-full bg-linear-to-br from-blue-600 to-purple-600 border-2 border-white/20 flex items-center justify-center hover:from-blue-500 hover:to-purple-500 transition-all duration-300 z-50 text-white shadow-lg shadow-blue-500/50",
            isRTL && "-left-3 right-auto"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            {isCollapsed ? (
              isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            ) : (
              isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
            )}
          </motion.div>
        </motion.button>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            
            {/* Sidebar */}
            <motion.aside 
              initial={{ x: isRTL ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "lg:hidden fixed top-0 bottom-0 z-50 bg-linear-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460] border-white/10 flex flex-col shadow-2xl",
                isRTL ? "border-l" : "border-r",
                "w-[85vw] max-w-[320px] sm:w-80",
                isRTL ? "right-0" : "left-0"
              )}
              role="dialog"
              aria-label="Navigation menu"
            >
              {/* Animated mesh gradient overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)] opacity-50" />
              
              {/* Mobile Header with Close Button */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 border-b border-white/10 lg:hidden relative z-10 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img 
                      src="/logo-white.png" 
                      alt="DNA Logo" 
                      className="h-14 w-auto object-contain"
                    />
                  </motion.div>
                  <div>
                    <h2 className="text-lg font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">DNA</h2>
                    <p className="text-xs text-white/60">Menu</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onMobileClose}
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                  aria-label="Close menu"
                >
                  ✕
                </motion.button>
              </motion.div>

              <SidebarContent 
                isCollapsed={isCollapsed}
                locale={locale}
                pathname={pathname}
                filteredMenuItems={filteredMenuItems}
                dictionary={dictionary}
                onMobileClose={onMobileClose}
                isRTL={isRTL}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
