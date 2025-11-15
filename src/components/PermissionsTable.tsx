'use client';

import { User } from '@/lib/db/repositories/userRepository';
import { Role, Permission, RegisteredResource } from '@/lib/access-control/permissions';
import { Dictionary } from '@/lib/i18n/getDictionary';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface PermissionsTableProps {
  users: User[];
  roles: Role[];
  permissions: Permission[];
  resources: RegisteredResource[];
  dictionary: Dictionary;
}

export function PermissionsTable({
  users,
  roles,
  permissions,
  resources,
  dictionary,
}: PermissionsTableProps) {
  // Group permissions by user (direct permissions)
  const userPermissions = users.map((user) => {
    const userDirectPerms = user.directPermissions
      .map((permId) => permissions.find((p) => p.id === permId))
      .filter((p): p is Permission => p !== undefined);

    return {
      user,
      permissions: userDirectPerms,
    };
  });

  // Group permissions by role
  const rolePermissions = roles.map((role) => {
    const rolePerms = role.permissionIds
      .map((permId) => permissions.find((p) => p.id === permId))
      .filter((p): p is Permission => p !== undefined);

    return {
      role,
      permissions: rolePerms,
    };
  });

  const getResourceName = (resourceKey: string) => {
    const resource = resources.find((r) => r.key === resourceKey);
    return resource?.displayNameKey || resourceKey;
  };

  return (
    <Tabs defaultValue="roles" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="roles">{dictionary.nav.roles}</TabsTrigger>
        <TabsTrigger value="users">{dictionary.nav.users}</TabsTrigger>
      </TabsList>

      <TabsContent value="roles" className="space-y-4">
        {rolePermissions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {dictionary.roles.noRoles}
          </div>
        ) : (
          rolePermissions.map(({ role, permissions: perms }) => (
            <Card key={role.id}>
              <CardHeader>
                <CardTitle>{role.name}</CardTitle>
                <CardDescription>{role.description || '-'}</CardDescription>
              </CardHeader>
              <CardContent>
                {perms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{dictionary.permissions.noPermissions}</p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{dictionary.permissions.resource}</TableHead>
                          <TableHead>{dictionary.permissions.action}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {perms.map((perm) => (
                          <TableRow key={perm.id}>
                            <TableCell className="font-medium">
                              {getResourceName(perm.resourceKey)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {dictionary.permissions[perm.action as keyof typeof dictionary.permissions] || perm.action}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>

      <TabsContent value="users" className="space-y-4">
        {userPermissions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {dictionary.users.noUsers}
          </div>
        ) : (
          userPermissions.map(({ user, permissions: perms }) => (
            <Card key={user.id}>
              <CardHeader>
                <CardTitle>{user.fullName || user.username}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">{dictionary.permissions.directPermissions}</h4>
                    {perms.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{dictionary.permissions.noPermissions}</p>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{dictionary.permissions.resource}</TableHead>
                              <TableHead>{dictionary.permissions.action}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {perms.map((perm) => (
                              <TableRow key={perm.id}>
                                <TableCell className="font-medium">
                                  {getResourceName(perm.resourceKey)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {dictionary.permissions[perm.action as keyof typeof dictionary.permissions] || perm.action}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  {user.groupIds.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">{dictionary.users.role}</h4>
                      <div className="flex gap-2 flex-wrap">
                        {user.groupIds.map((roleId) => {
                          const role = roles.find((r) => r.id === roleId);
                          return role ? (
                            <Badge key={roleId} variant="outline">
                              {role.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}
