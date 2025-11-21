'use client';

import { useState } from 'react';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { RolePermission } from '@/lib/db/repositories/rolePermissionRepository';
import { ROLES } from '@/config/roles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { updateRolePermissionsAction } from '@/lib/actions/rolePermissionActions';
import { Shield, Save, CheckCircle2, Info } from 'lucide-react';

export interface RolesPermissionsClientProps {
  dictionary: Dictionary;
  initialRolePermissions: RolePermission[];
}

export function RolesPermissionsClient({ dictionary, initialRolePermissions }: RolesPermissionsClientProps) {
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(initialRolePermissions);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [savedRole, setSavedRole] = useState<string | null>(null);

  const handlePermissionChange = (
    roleId: string,
    permission: keyof RolePermission['permissions'],
    value: boolean
  ) => {
    setRolePermissions((prev) =>
      prev.map((rp) =>
        rp.role === roleId
          ? {
              ...rp,
              permissions: {
                ...rp.permissions,
                [permission]: value,
              },
            }
          : rp
      )
    );
  };

  const handleSave = async (role: string) => {
    setIsSaving(role);
    setSavedRole(null);

    const rolePermission = rolePermissions.find((rp) => rp.role === role);
    if (!rolePermission) return;

    const result = await updateRolePermissionsAction(role as any, rolePermission.permissions);

    setIsSaving(null);

    if (result.success) {
      setSavedRole(role);
      setTimeout(() => setSavedRole(null), 3000);
    } else {
      alert(result.error || 'Failed to save permissions');
    }
  };

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    coach: 'Coach',
    parent: 'Parent',
    kid: 'Kid',
  };

  const permissionLabels: Record<keyof RolePermission['permissions'], { en: string; ar: string }> = {
    canAccessDashboard: { en: 'Access Dashboard', ar: 'الوصول إلى لوحة التحكم' },
    canManageUsers: { en: 'Manage Users', ar: 'إدارة المستخدمين' },
    canManageRoles: { en: 'Manage Roles', ar: 'إدارة الأدوار' },
    canViewReports: { en: 'View Reports', ar: 'عرض التقارير' },
    canManageSchedules: { en: 'Manage Schedules', ar: 'إدارة الجداول' },
    canManageAppointments: { en: 'Manage Appointments', ar: 'إدارة المواعيد' },
    canManageNotifications: { en: 'Manage Notifications', ar: 'إدارة الإشعارات' },
    canViewProfile: { en: 'View Profile', ar: 'عرض الملف الشخصي' },
    canEditProfile: { en: 'Edit Profile', ar: 'تعديل الملف الشخصي' },
    canAccessSettings: { en: 'Access Settings', ar: 'الوصول إلى الإعدادات' },
    canManageBackups: { en: 'Manage Backups', ar: 'إدارة النسخ الاحتياطي' },
    canAccessMessages: { en: 'Access Messages', ar: 'الوصول إلى الرسائل' },
    canCreateGroup: { en: 'Create Groups', ar: 'إنشاء مجموعات' },
    canSendPushNotifications: { en: 'Send Push Notifications', ar: 'إرسال إشعارات' },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {dictionary.roles?.title || 'Role Permissions'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage permissions for each role dynamically
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Object.values(ROLES).map((role) => {
          const rolePermission = rolePermissions.find((rp) => rp.role === role);
          if (!rolePermission) return null;

          const isSavingThis = isSaving === role;
          const isSavedThis = savedRole === role;

          return (
            <Card key={role} className="border-2 hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {role.toUpperCase()}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {roleLabels[role] || role}
                    </CardDescription>
                  </div>
                  {isSavedThis && (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {(Object.keys(permissionLabels) as Array<keyof RolePermission['permissions']>).map(
                  (permission) => (
                    <div key={permission} className="flex items-center justify-between py-2 border-b last:border-0">
                      <Label htmlFor={`${role}-${permission}`} className="text-sm font-medium cursor-pointer">
                        {permissionLabels[permission]?.en || permission}
                      </Label>
                      <Switch
                        id={`${role}-${permission}`}
                        checked={rolePermission.permissions[permission] ?? false}
                        onCheckedChange={(checked: boolean) =>
                          handlePermissionChange(role, permission, checked)
                        }
                      />
                    </div>
                  )
                )}
                <Button
                  onClick={() => handleSave(role)}
                  disabled={isSavingThis}
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSavingThis ? dictionary.common?.loading || 'Saving...' : dictionary.common?.save || 'Save'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
