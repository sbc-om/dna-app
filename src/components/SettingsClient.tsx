'use client';

import { useState, useEffect } from 'react';
import { Settings, Database, Download, Upload, Clock, Bell, UserCog, Award, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { useConfirm } from '@/components/ConfirmDialog';
import { PushNotificationSetup } from '@/components/PushNotificationSetup';
import { RolePermission } from '@/lib/db/repositories/rolePermissionRepository';
import AdminSettingsClient from '@/components/AdminSettingsClient';
import { MedalsManagement } from '@/components/MedalsManagement';
import { AcademiesManagement } from '@/components/AcademiesManagement';

interface SettingsClientProps {
  dictionary: Dictionary;
  locale: Locale;
  permissions: RolePermission['permissions'];
}

interface Backup {
  filename: string;
  timestamp: string;
}

export function SettingsClient({ dictionary, locale, permissions }: SettingsClientProps) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const response = await fetch('/api/backup');
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
      }
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  };

  const handleCreateBackup = async () => {
    const confirmed = await confirm({
      title: dictionary.settings?.createBackup || 'Create Backup',
      description: dictionary.settings?.createBackupConfirm || 'This will create a backup of all database data and uploaded files. Continue?',
      confirmText: dictionary.common.create,
      cancelText: dictionary.common.cancel,
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
      });

      if (response.ok) {
        await confirm({
          title: dictionary.common.success || 'Success',
          description: dictionary.settings?.backupCreated || 'Backup created successfully!',
          confirmText: 'OK',
        });
        loadBackups();
      } else {
        throw new Error('Backup failed');
      }
    } catch (error) {
      await confirm({
        title: dictionary.common.error || 'Error',
        description: dictionary.settings?.backupFailed || 'Failed to create backup',
        confirmText: 'OK',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handleDownloadBackup = (filename: string) => {
    window.open(`/api/backup/${filename}`, '_blank');
  };

  const handleRestoreBackup = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.tar.gz';
    
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const confirmed = await confirm({
        title: dictionary.settings?.restoreBackup || 'Restore Backup',
        description: dictionary.settings?.restoreWarning || 'WARNING: This will replace ALL current data with the backup data. This action cannot be undone. Continue?',
        confirmText: dictionary.settings?.restoreConfirm || 'Yes, Restore',
        cancelText: dictionary.common.cancel,
        variant: 'destructive',
      });

      if (!confirmed) return;

      setRestoring(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/restore', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          await confirm({
            title: dictionary.common.success || 'Success',
            description: dictionary.settings?.restoreSuccess || 'Backup restored successfully! Please restart the application for changes to take effect.',
            confirmText: 'OK',
          });
          window.location.reload();
        } else {
          throw new Error('Restore failed');
        }
      } catch (error) {
        await confirm({
          title: dictionary.common.error || 'Error',
          description: dictionary.settings?.restoreFailed || 'Failed to restore backup',
          confirmText: 'OK',
          variant: 'destructive',
        });
      }
      setRestoring(false);
    };

    fileInput.click();
  };

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-[#262626] dark:text-white flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-[#262626] rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000]">
              <Settings className="h-6 w-6 text-[#262626] dark:text-white" />
            </div>
            {dictionary.nav.settings || 'Settings'}
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400">
            {dictionary.settings?.description || 'Manage application settings and data backup'}
          </p>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="w-full bg-gray-100 dark:bg-[#1a1a1a] p-1.5 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000]">
            <TabsTrigger value="notifications" className="flex-1 min-w-fit gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#262626] rounded-lg transition-colors text-gray-600 dark:text-gray-400 data-[state=active]:text-[#262626] dark:data-[state=active]:text-white font-semibold">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">{dictionary.settings?.notifications || 'Notifications'}</span>
              <span className="sm:hidden">Notif</span>
            </TabsTrigger>
            {permissions.canManageAcademies && (
              <TabsTrigger value="academies" className="flex-1 min-w-fit gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#262626] rounded-lg transition-colors text-gray-600 dark:text-gray-400 data-[state=active]:text-[#262626] dark:data-[state=active]:text-white font-semibold">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">{dictionary.settings?.academies || 'Academies'}</span>
                <span className="sm:hidden">Academies</span>
              </TabsTrigger>
            )}
            {permissions.canManageBackups && (
              <TabsTrigger value="backup" className="flex-1 min-w-fit gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#262626] rounded-lg transition-colors text-gray-600 dark:text-gray-400 data-[state=active]:text-[#262626] dark:data-[state=active]:text-white font-semibold">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">{dictionary.settings?.backupRestore || 'Backup & Restore'}</span>
                <span className="sm:hidden">Backup</span>
              </TabsTrigger>
            )}
            {permissions.canManageBackups && (
              <TabsTrigger value="medals" className="flex-1 min-w-fit gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#262626] rounded-lg transition-colors text-gray-600 dark:text-gray-400 data-[state=active]:text-[#262626] dark:data-[state=active]:text-white font-semibold">
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">{dictionary.settings?.medals || 'Achievements'}</span>
                <span className="sm:hidden">Achievements</span>
              </TabsTrigger>
            )}
            {permissions.canManageBackups && (
              <TabsTrigger value="admin" className="flex-1 min-w-fit gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#262626] rounded-lg transition-colors text-gray-600 dark:text-gray-400 data-[state=active]:text-[#262626] dark:data-[state=active]:text-white font-semibold">
                <UserCog className="h-4 w-4" />
                <span className="hidden sm:inline">{dictionary.settings?.adminSettings || 'Admin Settings'}</span>
                <span className="sm:hidden">Admin</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="general" className="flex-1 min-w-fit gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#262626] rounded-lg transition-colors text-gray-600 dark:text-gray-400 data-[state=active]:text-[#262626] dark:data-[state=active]:text-white font-semibold">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{dictionary.settings?.general || 'General'}</span>
              <span className="sm:hidden">General</span>
            </TabsTrigger>
          </TabsList>

          {/* Academies Tab */}
          {permissions.canManageAcademies && (
            <TabsContent value="academies" className="space-y-4">
              <AcademiesManagement locale={locale} dictionary={dictionary} />
            </TabsContent>
          )}

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="border-2 border-[#DDDDDD] dark:border-[#000000] overflow-hidden">
              <CardHeader className="bg-gray-50 dark:bg-[#1a1a1a] border-b-2 border-[#DDDDDD] dark:border-[#000000] py-4">
                <CardTitle className="text-xl font-bold text-[#262626] dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                    <Bell className="h-5 w-5 text-[#262626] dark:text-white" />
                  </div>
                  {dictionary.settings?.pushNotifications || 'Push Notifications'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 bg-white dark:bg-[#262626]">
                <PushNotificationSetup
                  title=""
                  description=""
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup & Restore Tab */}
          {permissions.canManageBackups && (
          <TabsContent value="backup" className="space-y-4">
            <Card className="border-2 border-[#DDDDDD] dark:border-[#000000] overflow-hidden">
              <CardHeader className="bg-gray-50 dark:bg-[#1a1a1a] border-b-2 border-[#DDDDDD] dark:border-[#000000] py-4">
                <CardTitle className="text-xl font-bold text-[#262626] dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                    <Database className="h-5 w-5 text-[#262626] dark:text-white" />
                  </div>
                  {dictionary.settings?.backupManagement || 'Backup Management'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6 bg-white dark:bg-[#262626]">
                {/* Create Backup */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000]">
                  <div className="space-y-1 flex-1">
                    <h3 className="font-bold text-[#262626] dark:text-white flex items-center gap-2">
                      <Download className="h-5 w-5 text-green-600 dark:text-green-500" />
                      {dictionary.settings?.createNewBackup || 'Create New Backup'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {dictionary.settings?.createBackupDesc || 'Backup includes database and all uploaded files'}
                    </p>
                  </div>
                  <Button
                    onClick={handleCreateBackup}
                    disabled={loading}
                    className="h-12 px-6 bg-[#262626] hover:bg-black text-white active:scale-95 transition-colors disabled:opacity-50"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {loading ? dictionary.common.loading : dictionary.settings?.create || 'Create'}
                  </Button>
                </div>

                {/* Restore Backup */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000]">
                  <div className="space-y-1 flex-1">
                    <h3 className="font-bold text-[#262626] dark:text-white flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      {dictionary.settings?.restoreFromBackup || 'Restore from Backup'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {dictionary.settings?.restoreDesc || 'Upload a backup file to restore data'}
                    </p>
                  </div>
                  <Button
                    onClick={handleRestoreBackup}
                    disabled={restoring}
                    className="h-12 px-6 bg-[#262626] hover:bg-black text-white active:scale-95 transition-colors disabled:opacity-50"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {restoring ? dictionary.common.loading : dictionary.settings?.restore || 'Restore'}
                  </Button>
                </div>

                {/* Backup List */}
                <div>
                  <h3 className="text-lg font-bold text-[#262626] dark:text-white mb-4 flex items-center gap-2">
                    <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                      <Clock className="h-5 w-5 text-[#262626] dark:text-white" />
                    </div>
                    {dictionary.settings?.backupHistory || 'Backup History'}
                  </h3>
                  {backups.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                      <Database className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {dictionary.settings?.noBackups || 'No backups available'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {backups.map((backup) => (
                        <div
                          key={backup.filename}
                          className="flex items-center justify-between p-4 bg-white dark:bg-[#1a1a1a] rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#FF5F02]/10 dark:bg-[#FF5F02]/20 rounded-lg">
                              <Database className="h-5 w-5 text-[#262626] dark:text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-[#262626] dark:text-white">{backup.filename}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date(backup.timestamp.replace(/-/g, ':')).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleDownloadBackup(backup.filename)}
                            className="h-10 bg-[#262626] hover:bg-black text-white active:scale-95 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Achievements Tab */}
          {permissions.canManageBackups && (
          <TabsContent value="medals" className="space-y-4">
            <MedalsManagement dictionary={dictionary} />
          </TabsContent>
          )}

          {/* Admin Settings Tab */}
          {permissions.canManageBackups && (
          <TabsContent value="admin" className="space-y-4">
            <Card className="border-2 border-[#DDDDDD] dark:border-[#000000] overflow-hidden">
              <CardHeader className="bg-gray-50 dark:bg-[#1a1a1a] border-b-2 border-[#DDDDDD] dark:border-[#000000] py-4">
                <CardTitle className="text-xl font-bold text-[#262626] dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                    <UserCog className="h-5 w-5 text-[#262626] dark:text-white" />
                  </div>
                  {dictionary.settings?.adminSettings || 'Admin Settings'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 bg-white dark:bg-[#262626]">
                <AdminSettingsClient locale={locale} dict={dictionary} />
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-4">
            <Card className="border-2 border-[#DDDDDD] dark:border-[#000000] overflow-hidden">
              <CardHeader className="bg-gray-50 dark:bg-[#1a1a1a] border-b-2 border-[#DDDDDD] dark:border-[#000000] py-4">
                <CardTitle className="text-xl font-bold text-[#262626] dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                    <Settings className="h-5 w-5 text-[#262626] dark:text-white" />
                  </div>
                  {dictionary.settings?.generalSettings || 'General Settings'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4 bg-white dark:bg-[#262626]">
                {/* Language Settings */}
                <div className="p-5 bg-white dark:bg-[#1a1a1a] rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000]">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 flex-1">
                      <h3 className="font-bold text-[#262626] dark:text-white">
                        {dictionary.settings?.language || 'Language'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {dictionary.settings?.languageDesc || 'Choose your preferred language'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#262626] dark:text-white px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-lg">
                        {locale === 'ar' ? 'العربية' : 'English'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Theme Settings */}
                <div className="p-5 bg-white dark:bg-[#1a1a1a] rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000]">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 flex-1">
                      <h3 className="font-bold text-[#262626] dark:text-white">
                        {dictionary.settings?.theme || 'Theme'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {dictionary.settings?.themeDesc || 'Choose your preferred theme mode'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#262626] dark:text-white px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-lg">
                        {dictionary.settings?.system || 'System'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Time Zone */}
                <div className="p-5 bg-white dark:bg-[#1a1a1a] rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000]">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 flex-1">
                      <h3 className="font-bold text-[#262626] dark:text-white">
                        {dictionary.settings?.timezone || 'Time Zone'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {dictionary.settings?.timezoneDesc || 'Set your local time zone'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#262626] dark:text-white px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-lg">
                        {Intl.DateTimeFormat().resolvedOptions().timeZone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date Format */}
                <div className="p-5 bg-white dark:bg-[#1a1a1a] rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000]">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 flex-1">
                      <h3 className="font-bold text-[#262626] dark:text-white">
                        {dictionary.settings?.dateFormat || 'Date Format'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {dictionary.settings?.dateFormatDesc || 'Choose how dates are displayed'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#262626] dark:text-white px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-lg">
                        {new Date().toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Application Version */}
                <div className="p-5 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000]">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 flex-1">
                      <h3 className="font-bold text-[#262626] dark:text-white">
                        {dictionary.settings?.version || 'Application Version'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {dictionary.settings?.versionDesc || 'Current version of the application'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-[#262626] dark:text-white px-4 py-2 bg-black/5 dark:bg-white/5 rounded-lg">
                        v1.0.0
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDialog />
    </>
  );
}
