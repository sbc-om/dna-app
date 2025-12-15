'use client';

import { useMemo, useState } from 'react';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { RolePermission } from '@/lib/db/repositories/rolePermissionRepository';
import { ROLES, type UserRole } from '@/config/roles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { updateRolePermissionsAction } from '@/lib/actions/rolePermissionActions';
import { CheckCircle2, Save, Shield, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

export interface RolesPermissionsClientProps {
  dictionary: Dictionary;
  initialRolePermissions: RolePermission[];
}

export function RolesPermissionsClient({ dictionary, initialRolePermissions }: RolesPermissionsClientProps) {
  type PermissionKey = keyof RolePermission['permissions'];
  type PermissionGroup = 'core' | 'management' | 'communication';

  const roleOrder: UserRole[] = [ROLES.ADMIN, ROLES.MANAGER, ROLES.COACH, ROLES.PARENT, ROLES.KID];

  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(initialRolePermissions);
  const [baselineRolePermissions, setBaselineRolePermissions] = useState<RolePermission[]>(initialRolePermissions);
  const [activeRole, setActiveRole] = useState<UserRole>(roleOrder[0]);
  const [isSaving, setIsSaving] = useState<UserRole | null>(null);
  const [savedRole, setSavedRole] = useState<UserRole | null>(null);
  const [query, setQuery] = useState('');

  const permissionsCatalog = useMemo(() => {
    const items: Array<{ key: PermissionKey; group: PermissionGroup }> = [
      // Core
      { key: 'canAccessDashboard', group: 'core' },
      { key: 'canViewReports', group: 'core' },
      { key: 'canViewProfile', group: 'core' },
      { key: 'canEditProfile', group: 'core' },
      { key: 'canAccessSettings', group: 'core' },

      // Management
      { key: 'canManageUsers', group: 'management' },
      { key: 'canManageRoles', group: 'management' },
      { key: 'canManageAcademies', group: 'management' },
      { key: 'canManageAppointments', group: 'management' },
      { key: 'canManageSchedules', group: 'management' },
      { key: 'canManageCourses', group: 'management' },
      { key: 'canViewPayments', group: 'management' },
      { key: 'canManageNotifications', group: 'management' },
      { key: 'canManageBackups', group: 'management' },

      // Communication
      { key: 'canAccessMessages', group: 'communication' },
      { key: 'canCreateGroup', group: 'communication' },
      { key: 'canSendPushNotifications', group: 'communication' },
      { key: 'canSendWhatsApp', group: 'communication' },
    ];

    const groupOrder: PermissionGroup[] = ['core', 'management', 'communication'];
    const grouped: Record<PermissionGroup, Array<{ key: PermissionKey; group: PermissionGroup }>> = {
      core: [],
      management: [],
      communication: [],
    };

    for (const item of items) grouped[item.group].push(item);

    return groupOrder.map((g) => ({
      group: g,
      items: grouped[g],
    }));
  }, []);

  const roleLabel = (role: UserRole): string => {
    const rolesDict = dictionary.users?.roles as Record<string, string> | undefined;
    return rolesDict?.[role] || role.toUpperCase();
  };

  const permissionTitle = (key: PermissionKey): string => {
    const labels = dictionary.roles?.permissionLabels as
      | Record<string, { title?: string; description?: string }>
      | undefined;
    return labels?.[key]?.title || key;
  };

  const permissionDescription = (key: PermissionKey): string | undefined => {
    const labels = dictionary.roles?.permissionLabels as
      | Record<string, { title?: string; description?: string }>
      | undefined;
    return labels?.[key]?.description;
  };

  const groupTitle = (group: PermissionGroup): string => {
    const g = dictionary.roles?.permissionsEditor?.groups as Record<string, string> | undefined;
    return g?.[group] || group;
  };

  const baselineByRole = useMemo(() => {
    const map = new Map<UserRole, RolePermission>();
    for (const rp of baselineRolePermissions) {
      map.set(rp.role, rp);
    }
    return map;
  }, [baselineRolePermissions]);

  const isRoleDirty = (role: UserRole): boolean => {
    const current = rolePermissions.find((rp) => rp.role === role);
    const baseline = baselineByRole.get(role);
    if (!current || !baseline) return false;

    const keys = Object.keys(current.permissions) as PermissionKey[];
    for (const k of keys) {
      if ((current.permissions[k] ?? false) !== (baseline.permissions[k] ?? false)) return true;
    }
    return false;
  };

  const countEnabled = (role: UserRole): { enabled: number; total: number } => {
    const rp = rolePermissions.find((x) => x.role === role);
    if (!rp) return { enabled: 0, total: 0 };
    const keys = Object.keys(rp.permissions) as PermissionKey[];
    const enabled = keys.reduce((acc, k) => acc + ((rp.permissions[k] ?? false) ? 1 : 0), 0);
    return { enabled, total: keys.length };
  };

  const handlePermissionChange = (role: UserRole, permission: PermissionKey, value: boolean) => {
    setRolePermissions((prev) =>
      prev.map((rp) =>
        rp.role === role
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

  const handleSave = async (role: UserRole) => {
    setIsSaving(role);
    setSavedRole(null);

    const rolePermission = rolePermissions.find((rp) => rp.role === role);
    if (!rolePermission) {
      setIsSaving(null);
      return;
    }

    const result = await updateRolePermissionsAction(role, rolePermission.permissions);
    setIsSaving(null);

    if (result.success) {
      const updated = result.rolePermission;
      if (updated) {
        setRolePermissions((prev) => prev.map((rp) => (rp.role === role ? updated : rp)));
        setBaselineRolePermissions((prev) => prev.map((rp) => (rp.role === role ? updated : rp)));
      }
      setSavedRole(role);
      toast.success(
        dictionary.roles?.permissionsEditor?.saveSuccess || 'Permissions saved successfully'
      );
      setTimeout(() => setSavedRole(null), 2500);
    } else {
      toast.error(result.error || dictionary.roles?.permissionsEditor?.saveError || 'Failed to save permissions');
    }
  };

  const resetRole = (role: UserRole) => {
    const baseline = baselineByRole.get(role);
    if (!baseline) return;
    setRolePermissions((prev) =>
      prev.map((rp) => (rp.role === role ? { ...rp, permissions: { ...baseline.permissions } } : rp))
    );
  };

  const setManyForRole = (role: UserRole, keys: PermissionKey[], value: boolean) => {
    setRolePermissions((prev) =>
      prev.map((rp) => {
        if (rp.role !== role) return rp;
        const next = { ...rp.permissions };
        for (const k of keys) next[k] = value;
        return { ...rp, permissions: next };
      })
    );
  };

  const activeRolePermission = rolePermissions.find((rp) => rp.role === activeRole) || null;
  const lastUpdatedLabel = dictionary.roles?.permissionsEditor?.lastUpdated || 'Last updated';
  const saveLabel = dictionary.roles?.permissionsEditor?.save || dictionary.common?.save || 'Save';
  const savingLabel = dictionary.roles?.permissionsEditor?.saving || dictionary.common?.loading || 'Saving...';
  const savedLabel = dictionary.roles?.permissionsEditor?.saved || 'Saved';
  const permissionColLabel = dictionary.roles?.permissionsEditor?.permissionColumn || 'Permission';
  const enabledColLabel = dictionary.roles?.permissionsEditor?.enabledColumn || 'Enabled';
  const subtitle = dictionary.roles?.permissionsEditor?.subtitle || 'Manage permissions for each role';

  const activeDirty = isRoleDirty(activeRole);
  const isSavingThis = isSaving === activeRole;
  const isSavedThis = savedRole === activeRole;
  const activeCounts = countEnabled(activeRole);
  const resetLabel = dictionary.roles?.permissionsEditor?.reset || 'Reset';
  const enableAllLabel = dictionary.roles?.permissionsEditor?.enableAll || 'Enable all';
  const disableAllLabel = dictionary.roles?.permissionsEditor?.disableAll || 'Disable all';
  const searchPlaceholder = dictionary.roles?.permissionsEditor?.searchPlaceholder || 'Search permissions...';
  const noResultsLabel = dictionary.roles?.permissionsEditor?.noResults || 'No results.';
  const noRoleDataLabel = dictionary.roles?.permissionsEditor?.noRoleData || 'No role data.';

  const q = query.trim().toLowerCase();
  const filteredCatalog = !q
    ? permissionsCatalog
    : permissionsCatalog
        .map((group) => {
          const items = group.items.filter((item) => {
            const title = permissionTitle(item.key).toLowerCase();
            const desc = (permissionDescription(item.key) || '').toLowerCase();
            return title.includes(q) || desc.includes(q) || item.key.toLowerCase().includes(q);
          });
          return { ...group, items };
        })
        .filter((g) => g.items.length > 0);

  const filteredKeys: PermissionKey[] = [];
  for (const g of filteredCatalog) {
    for (const item of g.items) filteredKeys.push(item.key);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-gray-50 dark:bg-[#1a1a1a] flex items-center justify-center">
              <Shield className="h-5 w-5 text-[#262626] dark:text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#262626] dark:text-white truncate">
              {dictionary.roles?.title || dictionary.nav.roles}
            </h1>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Roles list */}
        <Card className="rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] lg:col-span-4 xl:col-span-3">
          <CardHeader className="pb-4 border-b-2 border-[#DDDDDD] dark:border-[#000000]">
            <CardTitle className="text-lg font-bold text-[#262626] dark:text-white">
              {dictionary.roles?.title || dictionary.nav.roles}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1">
              {roleOrder.map((role) => {
                const active = role === activeRole;
                const { enabled, total } = countEnabled(role);
                const dirty = isRoleDirty(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setActiveRole(role)}
                    className={
                      'shrink-0 lg:w-full text-left rounded-2xl border-2 px-4 py-3 transition-colors ' +
                      (active
                        ? 'bg-gray-50 dark:bg-[#262626] border-[#262626]/30 dark:border-white/20'
                        : 'bg-white dark:bg-[#1a1a1a] border-[#DDDDDD] dark:border-[#000000] hover:bg-gray-50 dark:hover:bg-[#262626]')
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {dirty && <span className="h-2 w-2 rounded-full bg-[#262626] dark:bg-white" />}
                          <div className="font-bold text-[#262626] dark:text-white truncate">{roleLabel(role)}</div>
                        </div>
                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          {enabled}/{total} {dictionary.roles?.permissions || 'Permissions'}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="font-mono text-[10px] border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300"
                      >
                        {role.toUpperCase()}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Permissions editor */}
        <Card className="rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] lg:col-span-8 xl:col-span-9 overflow-hidden">
          <CardHeader className="pb-4 border-b-2 border-[#DDDDDD] dark:border-[#000000]">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="text-lg font-bold text-[#262626] dark:text-white">
                    {dictionary.roles?.permissions || 'Permissions'}
                  </CardTitle>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {roleLabel(activeRole)}
                  </div>
                </div>
                {activeRolePermission && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {lastUpdatedLabel}: {new Date(activeRolePermission.updatedAt).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col sm:flex-row gap-2 w-full lg:max-w-[520px]">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-10 bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-black/30 dark:focus:border-white/20"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                      onClick={() => setManyForRole(activeRole, filteredKeys, true)}
                      disabled={filteredKeys.length === 0}
                    >
                      {enableAllLabel}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                      onClick={() => setManyForRole(activeRole, filteredKeys, false)}
                      disabled={filteredKeys.length === 0}
                    >
                      {disableAllLabel}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="font-semibold border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] text-gray-800 dark:text-gray-200"
                    >
                      {activeCounts.enabled}/{activeCounts.total}
                    </Badge>
                    {isSavedThis && (
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-semibold">
                        <CheckCircle2 className="h-4 w-4" />
                        {savedLabel}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                    onClick={() => resetRole(activeRole)}
                    disabled={!activeDirty || isSavingThis}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {resetLabel}
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="grid grid-cols-12 bg-gray-50 dark:bg-[#262626] border-b-2 border-[#DDDDDD] dark:border-[#000000]">
              <div className="col-span-9 px-4 py-3 font-bold text-[#262626] dark:text-white border-r border-[#DDDDDD] dark:border-[#000000]">
                {permissionColLabel}
              </div>
              <div className="col-span-3 px-4 py-3 font-bold text-[#262626] dark:text-white text-right">
                {enabledColLabel}
              </div>
            </div>

            <div className="max-h-[560px] overflow-y-auto">
              {activeRolePermission ? (
                filteredCatalog.length === 0 ? (
                  <div className="p-6 text-sm text-gray-600 dark:text-gray-400">{noResultsLabel}</div>
                ) : (
                  filteredCatalog.map((group) => (
                    <div key={group.group}>
                      <div className="px-4 py-2 text-xs font-bold tracking-widest text-gray-600 dark:text-gray-400 border-b border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a]">
                        {groupTitle(group.group)}
                      </div>
                      {group.items.map((item) => (
                        <div
                          key={item.key}
                          className="grid grid-cols-12 border-b border-[#DDDDDD] dark:border-[#000000] hover:bg-gray-50 dark:hover:bg-[#262626]"
                        >
                          <div className="col-span-9 px-4 py-3 border-r border-[#DDDDDD] dark:border-[#000000]">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-[#262626] dark:text-white">
                                  {permissionTitle(item.key)}
                                </div>
                                {permissionDescription(item.key) && (
                                  <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                    {permissionDescription(item.key)}
                                  </div>
                                )}
                              </div>
                              <Badge
                                variant="outline"
                                className="shrink-0 font-mono text-[10px] border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300"
                              >
                                {item.key}
                              </Badge>
                            </div>
                          </div>
                          <div className="col-span-3 px-4 py-3 flex items-center justify-end">
                            <Switch
                              checked={activeRolePermission.permissions[item.key] ?? false}
                              onCheckedChange={(checked: boolean) =>
                                handlePermissionChange(activeRole, item.key, checked)
                              }
                              className="data-[state=checked]:bg-[#262626] dark:data-[state=checked]:bg-white"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )
              ) : (
                <div className="p-6 text-sm text-gray-600 dark:text-gray-400">{noRoleDataLabel}</div>
              )}
            </div>

            <div className="border-t-2 border-[#DDDDDD] dark:border-[#000000] bg-gray-50 dark:bg-[#262626] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {dictionary.roles?.permissionsEditor?.hint || 'Changes apply immediately after saving.'}
                </div>
                <Button
                  type="button"
                  onClick={() => handleSave(activeRole)}
                  disabled={isSavingThis || !activeDirty}
                  className="h-11 rounded-xl bg-[#262626] dark:bg-white text-white dark:text-[#262626] hover:bg-[#1a1a1a] dark:hover:bg-gray-100"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSavingThis ? savingLabel : saveLabel}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
