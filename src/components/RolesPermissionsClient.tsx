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
import { Separator } from '@/components/ui/separator';
import { updateRolePermissionsAction } from '@/lib/actions/rolePermissionActions';
import { Shield, Save, CheckCircle2, UserCog, Crown, GraduationCap, Baby } from 'lucide-react';
import toast from 'react-hot-toast';

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
      toast.success('Permissions saved successfully');
      setTimeout(() => setSavedRole(null), 3000);
    } else {
      toast.error(result.error || 'Failed to save permissions');
    }
  };

  const roleLabels: Record<string, { en: string; ar: string; icon: any; color: string }> = {
    admin: { 
      en: 'Administrator', 
      ar: 'مدير النظام', 
      icon: Crown, 
      color: 'bg-orange-600' 
    },
    manager: {
      en: 'Academy Manager',
      ar: 'مدير الأكاديمية',
      icon: Shield,
      color: 'bg-orange-500'
    },
    coach: { 
      en: 'Coach', 
      ar: 'مدرب', 
      icon: GraduationCap, 
      color: 'bg-orange-500' 
    },
    parent: { 
      en: 'Parent', 
      ar: 'ولي الأمر', 
      icon: UserCog, 
      color: 'bg-orange-400' 
    },
    kid: { 
      en: 'Kid', 
      ar: 'طفل', 
      icon: Baby, 
      color: 'bg-orange-300' 
    },
  };

  const permissionLabels: Record<keyof RolePermission['permissions'], { en: string; ar: string }> = {
    canAccessDashboard: { en: 'Access Dashboard', ar: 'الوصول إلى لوحة التحكم' },
    canManageUsers: { en: 'Manage Users', ar: 'إدارة المستخدمين' },
    canManageRoles: { en: 'Manage Roles', ar: 'إدارة الأدوار' },
    canViewReports: { en: 'View Reports', ar: 'عرض التقارير' },
    canManageSchedules: { en: 'Manage Schedules', ar: 'إدارة الجداول' },
    canManageAppointments: { en: 'Manage Appointments', ar: 'إدارة المواعيد' },
    canManageAcademies: { en: 'Manage Academies', ar: 'إدارة الأكاديميات' },
    canManageNotifications: { en: 'Manage Notifications', ar: 'إدارة الإشعارات' },
    canViewProfile: { en: 'View Profile', ar: 'عرض الملف الشخصي' },
    canEditProfile: { en: 'Edit Profile', ar: 'تعديل الملف الشخصي' },
    canAccessSettings: { en: 'Access Settings', ar: 'الوصول إلى الإعدادات' },
    canManageBackups: { en: 'Manage Backups', ar: 'إدارة النسخ الاحتياطي' },
    canAccessMessages: { en: 'Access Messages', ar: 'الوصول إلى الرسائل' },
    canCreateGroup: { en: 'Create Groups', ar: 'إنشاء مجموعات' },
    canSendPushNotifications: { en: 'Send Push Notifications', ar: 'إرسال إشعارات' },
    canManageCourses: { en: 'Manage Courses', ar: 'إدارة الدورات' },
    canViewPayments: { en: 'View Payments', ar: 'عرض المدفوعات' },
    canSendWhatsApp: { en: 'Send WhatsApp Messages', ar: 'إرسال رسائل واتساب' },
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-orange-600">
                {dictionary.roles?.title || 'Role Permissions'}
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage permissions for each role dynamically
              </p>
            </div>
          </div>
        </div>
        <Separator />
      </div>

      {/* Roles Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {Object.values(ROLES).map((role) => {
          const rolePermission = rolePermissions.find((rp) => rp.role === role);
          if (!rolePermission) return null;

          const isSavingThis = isSaving === role;
          const isSavedThis = savedRole === role;
          const roleInfo = roleLabels[role];
          const RoleIcon = roleInfo?.icon || Shield;

          return (
            <Card 
              key={role} 
              className="relative overflow-hidden border-2 hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10"
            >
              {/* Card Header Border */}
              <div className={`h-2 ${roleInfo?.color || 'bg-orange-500'}`} />
              
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-xl ${roleInfo?.color || 'bg-orange-500'} flex items-center justify-center shadow-md`}>
                      <RoleIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        {roleInfo?.en || role}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant="outline" className="text-xs font-mono">
                          {role.toUpperCase()}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                  {isSavedThis && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Saved</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Permissions List */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {(Object.keys(permissionLabels) as Array<keyof RolePermission['permissions']>).map(
                    (permission) => (
                      <div 
                        key={permission} 
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <Label 
                          htmlFor={`${role}-${permission}`} 
                          className="text-sm font-medium cursor-pointer flex-1 group-hover:text-orange-600 transition-colors"
                        >
                          {permissionLabels[permission]?.en || permission}
                        </Label>
                        <Switch
                          id={`${role}-${permission}`}
                          checked={rolePermission.permissions[permission] ?? false}
                          onCheckedChange={(checked: boolean) =>
                            handlePermissionChange(role, permission, checked)
                          }
                          className="data-[state=checked]:bg-orange-500"
                        />
                      </div>
                    )
                  )}
                </div>

                {/* Save Button */}
                <Separator className="my-4" />
                <Button
                  onClick={() => handleSave(role)}
                  disabled={isSavingThis}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30 transition-all duration-300"
                  size="lg"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSavingThis ? dictionary.common?.loading || 'Saving...' : dictionary.common?.save || 'Save Permissions'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
