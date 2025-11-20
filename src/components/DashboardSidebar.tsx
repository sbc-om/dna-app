'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  Calendar,
  CalendarClock,
  Bell,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { useState, useEffect } from 'react';

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
    key: 'appointments',
    resourceKey: 'dashboard.appointments',
    labelKey: 'appointments',
    href: '/dashboard/appointments',
    icon: CalendarClock,
  },
  {
    key: 'users',
    resourceKey: 'dashboard.users',
    labelKey: 'users',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    key: 'messages',
    resourceKey: 'dashboard.messages',
    labelKey: 'messages',
    href: '/dashboard/messages',
    icon: MessageSquare,
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
  }, [pathname]);

  const filteredMenuItems = menuItems.filter(item =>
    item.resourceKey === 'dashboard' || accessibleResources.includes(item.resourceKey)
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo/Brand */}
      <div className={cn(
        "p-6 border-b border-gray-200 dark:border-gray-700",
        isCollapsed && "lg:px-3"
      )}>
        <Link href={`/${locale}/dashboard`} className={cn(
          "flex items-center gap-3 group",
          isCollapsed && "lg:justify-center"
        )}>
          <div className="h-10 w-10 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
            <img 
              src="/logo.png" 
              alt="DNA Logo" 
              className="h-10 w-10 object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#F2574C] via-[#30B2D2] to-[#F2574C] bg-clip-text text-transparent truncate">
                DNA Program
              </h2>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">Management System</p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const href = `/${locale}${item.href}`;
          const isActive = item.key === 'dashboard'
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          
          return (
            <div key={item.key} className="relative group/item">
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-[#F2574C] text-white" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                  isCollapsed && "lg:justify-center lg:px-3"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                
                {!isCollapsed && (
                  <span className="font-medium truncate flex-1">
                    {dictionary.nav[item.labelKey]}
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn(
        "p-4 border-t border-gray-200 dark:border-gray-700",
        isCollapsed && "lg:px-2"
      )}>
        <div className={cn(
          "text-xs text-center text-gray-500 dark:text-gray-400",
          isCollapsed && "lg:hidden"
        )}>
          <p>© 2025 DNA Program</p>
          <p className="mt-1">v1.0.0</p>
        </div>
        {isCollapsed && (
          <div className="hidden lg:block text-xs text-center text-gray-500 dark:text-gray-400">
            v1.0
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 relative",
        isCollapsed ? "w-20" : "w-72"
      )}>
        <SidebarContent />
        
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute top-20 -right-3 h-6 w-6 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-50",
            isRTL && "-left-3 right-auto"
          )}
        >
          {isCollapsed ? (
            isRTL ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
          ) : (
            isRTL ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </aside>

      {/* Mobile Sidebar */}
      <aside className={cn(
        "lg:hidden fixed top-0 bottom-0 z-50 w-72 bg-white dark:bg-gray-900 shadow-xl transition-transform duration-300 flex flex-col",
        isMobileOpen 
          ? "translate-x-0" 
          : isRTL 
            ? "translate-x-full" 
            : "-translate-x-full",
        isRTL ? "right-0" : "left-0"
      )}>
        <SidebarContent />
      </aside>
    </>
  );
}
