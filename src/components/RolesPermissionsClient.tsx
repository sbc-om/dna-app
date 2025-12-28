'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { RolePermission } from '@/lib/db/repositories/rolePermissionRepository';
import { ROLES, type UserRole } from '@/config/roles';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { updateRolePermissionsAction } from '@/lib/actions/rolePermissionActions';
import { CheckCircle2, Save, Shield, RotateCcw, Sparkles, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import type { Locale } from '@/config/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface RolesPermissionsClientProps {
  dictionary: Dictionary;
  initialRolePermissions: RolePermission[];
  locale: Locale;
}

export function RolesPermissionsClient({ dictionary, initialRolePermissions, locale }: RolesPermissionsClientProps) {
  type PermissionKey = keyof RolePermission['permissions'];
  type PermissionGroup = 'core' | 'management' | 'communication';
  type PermissionGroupFilter = 'all' | PermissionGroup;

  const roleOrder: UserRole[] = [ROLES.ADMIN, ROLES.MANAGER, ROLES.COACH, ROLES.PARENT, ROLES.PLAYER];

  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(initialRolePermissions);
  const [baselineRolePermissions, setBaselineRolePermissions] = useState<RolePermission[]>(initialRolePermissions);
  const [activeRole, setActiveRole] = useState<UserRole>(roleOrder[0]);
  const [activeGroup, setActiveGroup] = useState<PermissionGroupFilter>('all');
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
      { key: 'canManagePrograms', group: 'management' },
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

  const groupFilterLabel = (group: PermissionGroupFilter): string => {
    if (group === 'all') {
      return dictionary.roles?.allPermissionGroups || 'All groups';
    }
    return groupTitle(group);
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
  const catalogByGroup = activeGroup === 'all'
    ? permissionsCatalog
    : permissionsCatalog.filter((g) => g.group === activeGroup);

  const filteredCatalog = !q
    ? catalogByGroup
    : catalogByGroup
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

  const roleOptions = roleOrder.map((role) => {
    const counts = countEnabled(role);
    return {
      key: role,
      label: roleLabel(role),
      enabled: counts.enabled,
      total: counts.total,
    };
  });

  const activeRoleOption = roleOptions.find((r) => r.key === activeRole) ?? roleOptions[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 240, damping: 22 }}
      className="space-y-6"
    >
      {/* Game-like Header (matching Users page vibe) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="space-y-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
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

          <div className="w-full lg:w-auto">
            <div className="relative overflow-hidden rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white/80 dark:bg-[#262626]/80 backdrop-blur-xl shadow-lg">
              <motion.div
                className="absolute inset-0 bg-linear-to-r from-blue-600/8 via-purple-600/8 to-pink-600/8"
                animate={{ opacity: [0.35, 0.6, 0.35] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative p-2">
                <div className="flex h-12 w-full items-stretch overflow-hidden rounded-xl border-2 border-black/60 bg-[#0b0b0f] text-white shadow-lg shadow-black/30">
                  <div className="flex-1 min-w-0 h-full">
                    <Select value={activeRole} onValueChange={(v) => setActiveRole(v as UserRole)}>
                      <SelectTrigger className="h-full! w-full rounded-none border-0 bg-transparent px-4 py-0! text-white hover:bg-[#14141a]">
                        <div className="flex h-full w-full items-center gap-2 min-w-0">
                          <Shield className="h-4 w-4 text-white/90 shrink-0" />
                          <SelectValue placeholder={dictionary.roles?.filterByRole || 'Filter by role'} className="leading-none" />
                        </div>
                      </SelectTrigger>
                      <SelectContent align="start" className="rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000]">
                        {roleOptions.map((opt) => {
                          const dirty = isRoleDirty(opt.key);
                          return (
                            <SelectItem key={opt.key} value={opt.key}>
                              <span className="flex w-full items-center justify-between gap-3">
                                <span className="font-semibold">
                                  {dirty ? '• ' : ''}
                                  {opt.label}
                                </span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full border border-border bg-muted/60">
                                  {opt.enabled}/{opt.total}
                                </span>
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-px bg-white/10" />

                  <div className="shrink-0">
                    <Link href={`/${locale}/dashboard/users`} className="h-full">
                      <Button className="h-full rounded-none border-0 bg-transparent px-4 text-white hover:bg-[#14141a]">
                        <Users className="mr-2 h-4 w-4" />
                        <span className="font-semibold">{dictionary.nav.users}</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters / Controls (like Users page) */}
      <div className={`${cardShell} p-5 sm:p-6`}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold text-[#262626] dark:text-white">
                {dictionary.roles?.roleList || dictionary.roles?.title || dictionary.nav.roles}
              </div>
              <div className={`text-sm ${subtleText} truncate`}>
                {activeRoleOption?.label} • {activeCounts.enabled}/{activeCounts.total}
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-3">
            {/* Group select + Search (single grouped control) */}
            <div className="flex-1 min-w-0">
              <div className="flex h-12 w-full items-stretch overflow-hidden rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626]">
                <div className="shrink-0 min-w-[200px]">
                  <Select value={activeGroup} onValueChange={(v) => setActiveGroup(v as PermissionGroupFilter)}>
                    <SelectTrigger className="h-full! w-full rounded-none border-0 bg-transparent px-4 py-0! text-[#262626] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                      <SelectValue placeholder={dictionary.roles?.filterByGroup || 'Filter by group'} className="leading-none" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000]">
                      <SelectItem value="all">{groupFilterLabel('all')}</SelectItem>
                      <SelectItem value="core">{groupFilterLabel('core')}</SelectItem>
                      <SelectItem value="management">{groupFilterLabel('management')}</SelectItem>
                      <SelectItem value="communication">{groupFilterLabel('communication')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-px bg-[#DDDDDD] dark:bg-[#000000]" />

                <div className="flex-1 min-w-0">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-full! rounded-none border-0 bg-transparent px-4 py-0! text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-0"
                  />
                </div>
              </div>
            </div>

            {/* Bulk actions (equal height) */}
            <div className="shrink-0">
              <div className="flex h-12 items-stretch overflow-hidden rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626]">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-full rounded-none border-0 px-4 text-[#262626] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                  onClick={() => setManyForRole(activeRole, filteredKeys, true)}
                  disabled={filteredKeys.length === 0}
                >
                  {enableAllLabel}
                </Button>
                <div className="w-px bg-[#DDDDDD] dark:bg-[#000000]" />
                <Button
                  type="button"
                  variant="ghost"
                  className="h-full rounded-none border-0 px-4 text-[#262626] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                  onClick={() => setManyForRole(activeRole, filteredKeys, false)}
                  disabled={filteredKeys.length === 0}
                >
                  {disableAllLabel}
                </Button>
              </div>
            </div>
          </div>

          <div className={`text-sm ${subtleText}`}>
            {activeRolePermission && (
              <span>
                {lastUpdatedLabel}: {new Date(activeRolePermission.updatedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Permissions editor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={cardShell}
      >
        <div className={`${cardHeader} p-5 sm:p-6 space-y-2`}>
          <div className="text-lg sm:text-xl font-bold text-[#262626] dark:text-white">
            {dictionary.roles?.permissions || 'Permissions'}
          </div>
          <div className={`text-sm ${subtleText}`}>{roleLabel(activeRole)}</div>
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

        {/* Bottom form actions (Save moved here) */}
        <div className="border-t-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className={`text-sm ${subtleText}`}>
              {activeRolePermission && (
                <span>
                  {lastUpdatedLabel}: {new Date(activeRolePermission.updatedAt).toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isSavedThis && (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  {savedLabel}
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                className="h-12 border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] text-[#262626] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                onClick={() => resetRole(activeRole)}
                disabled={!activeDirty || isSavingThis}
              >
                <RotateCcw className="me-2 h-4 w-4" />
                {resetLabel}
              </Button>
              <Button
                type="button"
                onClick={() => handleSave(activeRole)}
                disabled={isSavingThis || !activeDirty}
                className="h-12 bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:opacity-90 border-2 border-transparent shadow-lg shadow-purple-500/30"
              >
                <Save className="me-2 h-4 w-4" />
                {isSavingThis ? savingLabel : saveLabel}
              </Button>
            </div>
          </div>

          <div className={`mt-3 text-sm ${subtleText}`}>{dictionary.roles?.permissionsEditor?.hint}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}
