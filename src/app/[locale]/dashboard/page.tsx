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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{dictionary.dashboard.title}</h1>
        <p className="text-muted-foreground mt-2">{dictionary.dashboard.welcomeMessage}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.href} href={stat.href}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {(canManageUsers || canManageRoles) && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common management tasks</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {canManageUsers && (
                <Link href={`/${locale}/dashboard/users`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    {dictionary.users.createUser}
                  </Button>
                </Link>
              )}
              {canManageRoles && (
                <Link href={`/${locale}/dashboard/roles`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="mr-2 h-4 w-4" />
                    {dictionary.roles.createRole}
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Users</span>
              <span className="text-sm font-medium">
                {users.filter((u) => u.isActive).length} / {users.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Roles</span>
              <span className="text-sm font-medium">
                {roles.filter((r) => r.isActive).length} / {roles.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Registered Resources</span>
              <span className="text-sm font-medium">{resources.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
