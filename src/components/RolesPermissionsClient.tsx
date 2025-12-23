'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { RolePermission } from '@/lib/db/repositories/rolePermissionRepository';
import { ROLES, type UserRole } from '@/config/roles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { updateRolePermissionsAction } from '@/lib/actions/rolePermissionActions';
import { CheckCircle2, Save, Shield, RotateCcw, Sparkles, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import type { Locale } from '@/config/i18n';

export interface RolesPermissionsClientProps {
  dictionary: Dictionary;
  initialRolePermissions: RolePermission[];
  locale: Locale;
}

export function RolesPermissionsClient({ dictionary, initialRolePermissions, locale }: RolesPermissionsClientProps) {
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

  const cardShell =
    'bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] rounded-2xl shadow-lg relative overflow-hidden';
  const cardHeader = 'border-b border-[#DDDDDD] dark:border-[#000000]';
  const subtleText = 'text-gray-600 dark:text-gray-400';

  const roleChipStyles: Record<UserRole, { accentBorder: string; accentText: string }> = {
    admin: { accentBorder: 'border-violet-500', accentText: 'text-violet-700 dark:text-violet-400' },
    manager: { accentBorder: 'border-emerald-500', accentText: 'text-emerald-700 dark:text-emerald-400' },
    coach: { accentBorder: 'border-blue-500', accentText: 'text-blue-700 dark:text-blue-400' },
    parent: { accentBorder: 'border-sky-500', accentText: 'text-sky-700 dark:text-sky-400' },
    kid: { accentBorder: 'border-red-500', accentText: 'text-red-700 dark:text-red-400' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 240, damping: 22 }}
      className="space-y-6"
    >
      {/* Animated Header (match Users page style) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="relative">
          <motion.div
            className="absolute -inset-4 bg-linear-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-2xl blur-xl"
            animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative">
            <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="h-8 w-8 text-purple-600" />
              </motion.div>
              {dictionary.roles?.title || dictionary.nav.roles}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{subtitle}</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex gap-2"
        >
          <Link href={`/${locale}/dashboard/users`}>
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                className="h-11 border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] text-[#262626] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
              >
                <Users className="mr-2 h-4 w-4" />
                {dictionary.nav.users}
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </motion.div>

      {/* Role List (no animations requested) */}
      <div className={`${cardShell} p-5 sm:p-6`}>
        <div className="absolute inset-0 bg-linear-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 opacity-50" />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-10 w-10 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-base font-bold text-[#262626] dark:text-white">
              {dictionary.roles?.roleList || dictionary.roles?.title || dictionary.nav.roles}
            </span>
          </div>

          <OverlayScrollbarsComponent
            className="w-full"
            options={{
              scrollbars: { theme: 'os-theme-dark', visibility: 'auto', autoHide: 'move', autoHideDelay: 800 },
              overflow: { x: 'scroll', y: 'hidden' },
            }}
            defer
          >
            <div className="flex flex-nowrap gap-2 pb-1">
              {roleOrder.map((role, index) => {
                const active = activeRole === role;
                const { enabled, total } = countEnabled(role);
                const dirty = isRoleDirty(role);
                const style = roleChipStyles[role];

                return (
                  <button
                    key={role}
                    onClick={() => setActiveRole(role)}
                    type="button"
                    className={
                      'px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors border-2 shrink-0 ' +
                      (active
                        ? `bg-linear-to-br from-white to-gray-50 dark:from-[#1a1a1a] dark:to-[#0a0a0a] ${style.accentBorder} ${style.accentText} shadow-lg`
                        : `bg-white dark:bg-[#262626] text-gray-700 dark:text-gray-300 border-[#DDDDDD] dark:border-[#000000] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]`)
                    }
                  >
                    <span className="flex items-center gap-2">
                      {dirty && <span className="h-2 w-2 rounded-full bg-orange-400" />}
                      {roleLabel(role)}
                      <span
                        className={
                          'px-2 py-0.5 rounded-full text-xs font-bold border ' +
                          (active
                            ? 'bg-transparent border-current text-current'
                            : 'bg-gray-100 dark:bg-[#1a1a1a] border-[#DDDDDD] dark:border-[#000000] text-gray-700 dark:text-gray-300')
                        }
                      >
                        {enabled}/{total}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </OverlayScrollbarsComponent>

          <div className="shrink-0">
            <Badge
              variant="outline"
              className="border-2 border-[#DDDDDD] dark:border-[#000000] bg-white/80 dark:bg-[#1a1a1a] text-[#262626] dark:text-white"
            >
              {roleLabel(activeRole)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Permissions editor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className={cardShell}
      >
        <div className={`${cardHeader} p-5 sm:p-6 space-y-3`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-lg sm:text-xl font-bold text-[#262626] dark:text-white">
                {dictionary.roles?.permissions || 'Permissions'}
              </div>
              <div className={`mt-1 text-sm ${subtleText}`}>{roleLabel(activeRole)}</div>
            </div>

            {activeRolePermission && (
              <div className={`text-xs ${subtleText}`}>
                {lastUpdatedLabel}: {new Date(activeRolePermission.updatedAt).toLocaleString()}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:max-w-[720px]">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-11 bg-white dark:bg-[#262626] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 border-2 border-[#DDDDDD] dark:border-[#000000] focus-visible:ring-0"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] text-[#262626] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                  onClick={() => setManyForRole(activeRole, filteredKeys, true)}
                  disabled={filteredKeys.length === 0}
                >
                  {enableAllLabel}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] text-[#262626] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
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
                  className="font-semibold border-2 border-[#DDDDDD] dark:border-[#000000] bg-white/80 dark:bg-[#1a1a1a] text-[#262626] dark:text-white"
                >
                  {activeCounts.enabled}/{activeCounts.total}
                </Badge>
                {isSavedThis && (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    {savedLabel}
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-11 border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] text-[#262626] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                onClick={() => resetRole(activeRole)}
                disabled={!activeDirty || isSavingThis}
              >
                <RotateCcw className="me-2 h-4 w-4" />
                {resetLabel}
              </Button>
            </div>
          </div>

          <div className={`text-sm ${subtleText}`}>{dictionary.roles?.permissionsEditor?.hint}</div>
        </div>

        <div className="grid grid-cols-12 bg-gray-50 dark:bg-[#1a1a1a] border-b-2 border-[#DDDDDD] dark:border-[#000000]">
          <div className="col-span-9 px-4 py-3 font-bold text-[#262626] dark:text-white border-r-2 border-[#DDDDDD] dark:border-[#000000]">
            {permissionColLabel}
          </div>
          <div className="col-span-3 px-4 py-3 font-bold text-[#262626] dark:text-white text-right">
            {enabledColLabel}
          </div>
        </div>

        <OverlayScrollbarsComponent
          className="max-h-[560px]"
          options={{
            scrollbars: { theme: 'os-theme-dark', visibility: 'auto', autoHide: 'move', autoHideDelay: 800 },
            overflow: { x: 'hidden', y: 'scroll' },
          }}
          defer
        >
          <div>
            {activeRolePermission ? (
              filteredCatalog.length === 0 ? (
                <div className={`p-6 text-sm ${subtleText}`}>{noResultsLabel}</div>
              ) : (
                filteredCatalog.map((group) => (
                  <div key={group.group}>
                    <div className="px-4 py-2 text-xs font-bold tracking-widest text-gray-600 dark:text-gray-400 border-b border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626]">
                      {groupTitle(group.group)}
                    </div>
                    {group.items.map((item) => (
                      <div
                        key={item.key}
                        className="grid grid-cols-12 border-b border-[#DDDDDD]/70 dark:border-[#000000] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                      >
                        <div className="col-span-9 px-4 py-3 border-r-2 border-[#DDDDDD] dark:border-[#000000]">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-[#262626] dark:text-white">
                                {permissionTitle(item.key)}
                              </div>
                              {permissionDescription(item.key) && (
                                <div className={`mt-1 text-xs ${subtleText}`}>
                                  {permissionDescription(item.key)}
                                </div>
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className="hidden lg:inline-flex shrink-0 font-mono text-[10px] border-2 border-[#DDDDDD] dark:border-[#000000] bg-white/80 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300"
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
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )
            ) : (
              <div className={`p-6 text-sm ${subtleText}`}>{noRoleDataLabel}</div>
            )}
          </div>
        </OverlayScrollbarsComponent>

        <div className="border-t-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] p-4">
          <div className="flex justify-end">
            <motion.div whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                onClick={() => handleSave(activeRole)}
                disabled={isSavingThis || !activeDirty}
                className="h-11 bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:opacity-90 border-2 border-transparent shadow-lg shadow-purple-500/30"
              >
                <Save className="me-2 h-4 w-4" />
                {isSavingThis ? savingLabel : saveLabel}
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
