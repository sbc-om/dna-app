'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  Building2,
  CalendarClock,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Settings,
  BookOpen,
  DollarSign,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { useState, useEffect } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

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
    key: 'courses',
    resourceKey: 'dashboard.courses',
    labelKey: 'courses',
    href: '/dashboard/courses',
    icon: BookOpen,
  },
  {
    key: 'payments',
    resourceKey: 'dashboard.payments',
    labelKey: 'payments',
    href: '/dashboard/payments',
    icon: DollarSign,
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
  <div className="flex flex-col h-full">
    {/* Logo/Brand - Hidden on mobile (mobile has its own header) */}
    <div className={cn(
      "hidden lg:block p-6 border-b border-[#000000]",
      isCollapsed && "lg:px-3"
    )}>
      <Link href={`/${locale}/dashboard`} className={cn(
        "flex items-center gap-3 group",
        isCollapsed && "lg:justify-center"
      )}>
        <div className="h-10 w-10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
          <img 
            src="/logo.png" 
            alt="DNA Logo" 
            className="h-10 w-10 object-contain"
          />
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">
              DNA
            </h2>
            <p className="text-xs font-medium text-white truncate">Discover Natural Ability</p>
          </div>
        )}
      </Link>
    </div>

    {/* Navigation */}
    <OverlayScrollbarsComponent
      element="nav"
      className="flex-1 p-4 space-y-2"
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
              onClick={() => onMobileClose && onMobileClose()}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-lg transition-colors duration-200 touch-manipulation",
                "active:scale-[0.98]",
                isActive 
                  ? cn(
                      "bg-white/5 text-white border border-white/10",
                      isRTL ? "border-r-4 border-r-white/40" : "border-l-4 border-l-white/40"
                    )
                  : "text-white/80 hover:text-white hover:bg-white/5 border-2 border-transparent",
                isCollapsed && "lg:justify-center lg:px-3",
                "min-h-12" // Touch-friendly minimum height
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              
              {!isCollapsed && (
                <span className="font-medium truncate flex-1 text-[15px]">
                  {dictionary.nav[item.labelKey]}
                </span>
              )}
              
            </Link>
          </div>
        );
      })}
    </OverlayScrollbarsComponent>

    {/* Footer */}
    <div className={cn(
      "p-4 border-t border-[#000000]",
      isCollapsed && "lg:px-2"
    )}>
      <div className={cn(
        "text-xs text-center text-white",
        isCollapsed && "lg:hidden"
      )}>
        <p>© 2025 Discover Natural Ability</p>
        <p className="mt-1">v1.0.0</p>
      </div>
      {isCollapsed && (
        <div className="hidden lg:block text-xs text-center text-white">
          v1.0
        </div>
      )}
    </div>
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
        "hidden lg:flex flex-col bg-[#262626] border-r border-[#000000] transition-all duration-300 relative",
        isCollapsed ? "w-20" : "w-72"
      )}>
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
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute top-20 -right-3 h-7 w-7 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center hover:bg-[#0f0f0f] transition-colors duration-200 z-50 text-white active:scale-95",
            isRTL && "-left-3 right-auto"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            isRTL ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
          ) : (
            isRTL ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </aside>

      {/* Mobile Sidebar */}
      <aside 
        className={cn(
          "lg:hidden fixed top-0 bottom-0 z-50 bg-[#262626] border-r border-[#000000] transition-all duration-300 ease-out flex flex-col",
          "w-[85vw] max-w-[320px] sm:w-80",
          isMobileOpen 
            ? "translate-x-0" 
            : isRTL 
              ? "translate-x-full" 
              : "-translate-x-full",
          isRTL ? "right-0" : "left-0"
        )}
        role="dialog"
        aria-label="Navigation menu"
      >
        {/* Mobile Header with Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-[#000000] lg:hidden">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="DNA Logo" 
              className="h-8 w-8 object-contain"
            />
            <div>
              <h2 className="text-lg font-bold text-white">DNA</h2>
              <p className="text-xs text-white">Menu</p>
            </div>
          </div>
          <button
            onClick={onMobileClose}
            className="h-10 w-10 rounded-lg flex items-center justify-center text-white hover:bg-[#000000] transition-colors active:scale-95"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <SidebarContent 
          isCollapsed={isCollapsed}
          locale={locale}
          pathname={pathname}
          filteredMenuItems={filteredMenuItems}
          dictionary={dictionary}
          onMobileClose={onMobileClose}
          isRTL={isRTL}
        />
      </aside>
    </>
  );
}
