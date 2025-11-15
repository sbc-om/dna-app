'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  FolderTree,
  Key
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dictionary } from '@/lib/i18n/getDictionary';

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
    key: 'resources',
    resourceKey: 'dashboard.resources',
    labelKey: 'resources',
    href: '/dashboard/resources',
    icon: FolderTree,
  },
  {
    key: 'permissions',
    resourceKey: 'dashboard.permissions',
    labelKey: 'permissions',
    href: '/dashboard/permissions',
    icon: Key,
  },
];

export interface DashboardSidebarProps {
  dictionary: Dictionary;
  accessibleResources: string[];
  locale: string;
}

export function DashboardSidebar({ 
  dictionary, 
  accessibleResources,
  locale
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const filteredMenuItems = menuItems.filter(item =>
    accessibleResources.includes(item.resourceKey)
  );

  return (
    <aside className="w-64 border-r bg-card">
      <div className="p-6">
        <h2 className="text-lg font-semibold">{dictionary.common.appName}</h2>
      </div>
      <nav className="space-y-1 px-3">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const href = `/${locale}${item.href}`;
          
          // For dashboard home, only exact match
          // For other pages, check if starts with the href
          const isActive = item.key === 'dashboard'
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={item.key}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{dictionary.nav[item.labelKey]}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
