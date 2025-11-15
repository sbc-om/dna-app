import { getDictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listUsers } from '@/lib/db/repositories/userRepository';
import { listRoles } from '@/lib/db/repositories/roleRepository';
import { listResources } from '@/lib/db/repositories/resourceRepository';
import { listPermissions } from '@/lib/db/repositories/permissionRepository';
import { Users, Shield, FolderTree, Lock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getCurrentUser, hasPermission } from '@/lib/auth/auth';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params as { locale: Locale };
  const dictionary = await getDictionary(locale);
  
  // Get current user for permission checks
  const currentUser = await getCurrentUser();
  
  // Check permissions for quick actions
  const canManageUsers = currentUser ? await hasPermission(currentUser.id, 'dashboard.users', 'create') : false;
  const canManageRoles = currentUser ? await hasPermission(currentUser.id, 'dashboard.roles', 'create') : false;

  // Get statistics
  const [users, roles, resources, permissions] = await Promise.all([
    listUsers(),
    listRoles(),
    listResources(),
    listPermissions(),
  ]);

  const stats = [
    {
      title: dictionary.nav.users,
      description: 'Total system users',
      value: users.length,
      icon: Users,
      href: `/${locale}/dashboard/users`,
    },
    {
      title: dictionary.nav.roles,
      description: 'User roles and groups',
      value: roles.length,
      icon: Shield,
      href: `/${locale}/dashboard/roles`,
    },
    {
      title: dictionary.nav.resources,
      description: 'Registered resources',
      value: resources.length,
      icon: FolderTree,
      href: `/${locale}/dashboard/resources`,
    },
    {
      title: dictionary.nav.permissions,
      description: 'Total permissions',
      value: permissions.length,
      icon: Lock,
      href: `/${locale}/dashboard/permissions`,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <img
            src="/logo.png"
            alt="DNA Logo"
            className="h-16 w-16 object-contain"
          />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{dictionary.dashboard.title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{dictionary.dashboard.welcomeMessage}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const accentClasses = [
            'text-[#F2574C] bg-[#F2574C]/10',
            'text-[#30B2D2] bg-[#30B2D2]/10',
            'text-[#E8A12D] bg-[#E8A12D]/10',
            'text-black bg-black/10'
          ];
          const accentClass = accentClasses[index] || 'text-gray-600 bg-gray-200/40';
          return (
            <Link key={stat.href} href={stat.href}>
              <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {stat.title}
                  </CardTitle>
                  <div
                    className={`p-2 rounded-md ${accentClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{stat.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Bottom Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {(canManageUsers || canManageRoles) && (
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Common management tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {canManageUsers && (
                <Link href={`/${locale}/dashboard/users`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4 text-[#30B2D2]" />
                    {dictionary.users.createUser}
                  </Button>
                </Link>
              )}
              {canManageRoles && (
                <Link href={`/${locale}/dashboard/roles`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="mr-2 h-4 w-4 text-[#F2574C]" />
                    {dictionary.roles.createRole}
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">System Status</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Current system overview
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-md bg-[#30B2D2]/10">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Users</span>
              <span className="text-sm font-semibold text-[#30B2D2]">
                {users.filter((u) => u.isActive).length} / {users.length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-[#F2574C]/10">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Roles</span>
              <span className="text-sm font-semibold text-[#F2574C]">
                {roles.filter((r) => r.isActive).length} / {roles.length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-[#E8A12D]/10">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Registered Resources</span>
              <span className="text-sm font-semibold text-[#E8A12D]">{resources.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
