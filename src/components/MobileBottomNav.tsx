'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard,
  CalendarClock,
  MessageSquare,
  User,
  BookOpen,
  Users,
  Settings,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MobileBottomNavProps {
  locale: string;
  accessibleResources: string[];
}

interface NavItem {
  key: string;
  resourceKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>,
  label: string;
}

// Define all possible nav items matching DashboardSidebar
const allNavItems: NavItem[] = [
  {
    key: 'dashboard',
    resourceKey: 'dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard'
  },
  {
    key: 'appointments',
    resourceKey: 'dashboard.appointments',
    href: '/dashboard/appointments',
    icon: CalendarClock,
    label: 'Schedule'
  },
  {
    key: 'users',
    resourceKey: 'dashboard.users',
    href: '/dashboard/users',
    icon: Users,
    label: 'Users'
  },
  {
    key: 'courses',
    resourceKey: 'dashboard.courses',
    href: '/dashboard/courses',
    icon: BookOpen,
    label: 'Courses'
  },
  {
    key: 'payments',
    resourceKey: 'dashboard.payments',
    href: '/dashboard/payments',
    icon: DollarSign,
    label: 'Payments'
  },
  {
    key: 'messages',
    resourceKey: 'dashboard.messages',
    href: '/dashboard/messages',
    icon: MessageSquare,
    label: 'Messages'
  },
  {
    key: 'settings',
    resourceKey: 'dashboard.settings',
    href: '/dashboard/settings',
    icon: Settings,
    label: 'Settings'
  },
  {
    key: 'profile',
    resourceKey: 'dashboard.profile',
    href: '/dashboard/profile',
    icon: User,
    label: 'Profile'
  }
];

export function MobileBottomNav({ locale, accessibleResources }: MobileBottomNavProps) {
  const pathname = usePathname();

  // Filter items based on accessible resources (same logic as DashboardSidebar)
  const filteredItems = allNavItems
    .filter(item => 
      item.resourceKey === 'dashboard' || 
      item.resourceKey === 'dashboard.profile' ||
      accessibleResources.includes(item.resourceKey)
    )
    .slice(0, 5); // Limit to 5 items for mobile bottom nav

  return (
    <motion.nav 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-linear-to-t from-white/95 via-white/98 to-white dark:from-gray-900/95 dark:via-gray-900/98 dark:to-gray-900 backdrop-blur-xl border-t-2 border-white/20 dark:border-white/10 safe-bottom shadow-2xl"
      role="navigation"
      aria-label="Mobile bottom navigation"
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 opacity-50" />
      
      <div className="relative flex items-center justify-around px-2 py-2 max-w-screen-sm mx-auto">
        {filteredItems.map((item, index) => {
          const Icon = item.icon;
          const href = `/${locale}${item.href}`;
          const isActive = 
            item.key === 'home'
              ? pathname === href
              : pathname.startsWith(href);

          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={href}
                className="block"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 touch-manipulation min-w-16 group relative overflow-hidden",
                    isActive 
                      ? "text-[#262626] dark:text-white" 
                      : "text-gray-600 dark:text-gray-400"
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Active background */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-xl border-2 border-blue-500/30"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  
                  <motion.div 
                    className="relative z-10"
                    animate={isActive ? { 
                      rotate: [0, -5, 5, -5, 0],
                      scale: [1, 1.1, 1]
                    } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="h-5 w-5" />
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-30"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                  
                  <span className={cn(
                    "text-[10px] font-medium transition-colors duration-200 line-clamp-1 relative z-10",
                    isActive && "font-bold"
                  )}>
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.nav>
  );
}
