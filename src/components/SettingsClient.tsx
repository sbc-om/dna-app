'use client';

import { useState, useEffect } from 'react';
import { Settings, Database, Download, Upload, Trash2, Clock, Bell, UserCog, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { useConfirm } from '@/components/ConfirmDialog';
import { PushNotificationSetup } from '@/components/PushNotificationSetup';
import { RolePermission } from '@/lib/db/repositories/rolePermissionRepository';
import AdminSettingsClient from '@/components/AdminSettingsClient';
import { MedalsManagement } from '@/components/MedalsManagement';

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
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#262626] dark:text-white flex items-center gap-2">
            <Settings className="h-8 w-8 text-[#FF5F02]" />
            {dictionary.nav.settings || 'Settings'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {dictionary.settings?.description || 'Manage application settings and data backup'}
          </p>
        </div>

        <Tabs defaultValue="notifications" className="space-y-4">
          <TabsList className="w-full bg-white dark:bg-[#262626] border border-[#DDDDDD] dark:border-[#000000]">
            <TabsTrigger value="notifications" className="flex-1 min-w-fit">
              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{dictionary.settings?.notifications || 'Notifications'}</span>
              <span className="sm:hidden">Notif</span>
            </TabsTrigger>
            {permissions.canManageBackups && (
              <TabsTrigger value="backup" className="flex-1 min-w-fit">
                <Database className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{dictionary.settings?.backupRestore || 'Backup & Restore'}</span>
                <span className="sm:hidden">Backup</span>
              </TabsTrigger>
            )}
            {permissions.canManageBackups && (
              <TabsTrigger value="medals" className="flex-1 min-w-fit">
                <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{dictionary.settings?.medals || 'Medals'}</span>
                <span className="sm:hidden">Medals</span>
              </TabsTrigger>
            )}
            {permissions.canManageBackups && (
              <TabsTrigger value="admin" className="flex-1 min-w-fit">
                <UserCog className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{dictionary.settings?.adminSettings || 'Admin Settings'}</span>
                <span className="sm:hidden">Admin</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="general" className="flex-1 min-w-fit">
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{dictionary.settings?.general || 'General'}</span>
              <span className="sm:hidden">General</span>
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="border-2 border-[#DDDDDD] dark:border-[#000000] overflow-hidden">
              <CardHeader className="bg-white dark:bg-[#262626] border-b border-[#DDDDDD] dark:border-[#000000]">
                <CardTitle className="text-xl font-bold text-[#262626] dark:text-white flex items-center gap-2">
                  <Bell className="h-6 w-6 text-[#FF5F02]" />
                  {dictionary.settings?.pushNotifications || 'Push Notifications'}
                </CardTitle>
                <CardDescription>
                  {dictionary.settings?.pushNotificationsDescription || 'Get notified instantly when you receive new messages'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
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
              <CardHeader className="bg-white dark:bg-[#262626] border-b border-[#DDDDDD] dark:border-[#000000]">
                <CardTitle className="text-xl font-bold text-[#262626] dark:text-white flex items-center gap-2">
                  <Database className="h-6 w-6 text-[#FF5F02]" />
                  {dictionary.settings?.backupManagement || 'Backup Management'}
                </CardTitle>
                <CardDescription>
                  {dictionary.settings?.backupDescription || 'Create and manage backups of your database and uploaded files'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Create Backup */}
                <div className="flex items-center justify-between p-4 bg-[#DDDDDD] dark:bg-[#262626] rounded-lg border border-[#DDDDDD] dark:border-[#000000]">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-[#262626] dark:text-white">
                      {dictionary.settings?.createNewBackup || 'Create New Backup'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {dictionary.settings?.createBackupDesc || 'Backup includes database and all uploaded files'}
                    </p>
                  </div>
                  <Button
                    onClick={handleCreateBackup}
                    disabled={loading}
                    className="bg-[#FF5F02] hover:bg-[#262626] text-white"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {loading ? dictionary.common.loading : dictionary.settings?.create || 'Create'}
                  </Button>
                </div>

                {/* Restore Backup */}
                <div className="flex items-center justify-between p-4 bg-white dark:bg-[#262626] rounded-lg border-2 border-[#FF5F02]">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-[#FF5F02]">
                      {dictionary.settings?.restoreFromBackup || 'Restore from Backup'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {dictionary.settings?.restoreDesc || 'Upload a backup file to restore data'}
                    </p>
                  </div>
                  <Button
                    onClick={handleRestoreBackup}
                    disabled={restoring}
                    className="bg-[#262626] hover:bg-[#000000] text-white"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {restoring ? dictionary.common.loading : dictionary.settings?.restore || 'Restore'}
                  </Button>
                </div>

                {/* Backup List */}
                <div>
                  <h3 className="text-lg font-semibold text-[#262626] dark:text-white mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#FF5F02]" />
                    {dictionary.settings?.backupHistory || 'Backup History'}
                  </h3>
                  {backups.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {dictionary.settings?.noBackups || 'No backups available'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {backups.map((backup) => (
                        <div
                          key={backup.filename}
                          className="flex items-center justify-between p-4 bg-white dark:bg-[#262626] rounded-lg border border-[#DDDDDD] dark:border-[#000000] hover:border-[#FF5F02] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Database className="h-5 w-5 text-[#FF5F02]" />
                            <div>
                              <p className="font-medium text-[#262626] dark:text-white">{backup.filename}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(backup.timestamp.replace(/-/g, ':')).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadBackup(backup.filename)}
                            className="border-[#FF5F02] text-[#FF5F02] hover:bg-[#FF5F02] hover:text-white"
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

          {/* Medals Tab */}
          {permissions.canManageBackups && (
          <TabsContent value="medals" className="space-y-4">
            <MedalsManagement dictionary={dictionary} />
          </TabsContent>
          )}

          {/* Admin Settings Tab */}
          {permissions.canManageBackups && (
          <TabsContent value="admin" className="space-y-4">
            <Card className="border-2 border-[#DDDDDD] dark:border-[#000000] overflow-hidden">
              <CardHeader className="bg-white dark:bg-[#262626] border-b border-[#DDDDDD] dark:border-[#000000]">
                <CardTitle className="text-xl font-bold text-[#262626] dark:text-white flex items-center gap-2">
                  <UserCog className="h-6 w-6 text-[#FF5F02]" />
                  {dictionary.settings?.adminSettings || 'Admin Settings'}
                </CardTitle>
                <CardDescription>
                  {dictionary.settings?.adminSettingsDescription || 'Manage administrative settings and configurations'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <AdminSettingsClient locale={locale} dict={dictionary} />
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-4">
            <Card className="border-2 border-[#DDDDDD] dark:border-[#000000] overflow-hidden">
              <CardHeader className="bg-white dark:bg-[#262626] border-b border-[#DDDDDD] dark:border-[#000000]">
                <CardTitle className="text-xl font-bold text-[#262626] dark:text-white flex items-center gap-2">
                  <Settings className="h-6 w-6 text-[#FF5F02]" />
                  {dictionary.settings?.generalSettings || 'General Settings'}
                </CardTitle>
                <CardDescription>
                  {dictionary.settings?.generalDescription || 'Configure general application settings'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Language Settings */}
                <div className="p-4 bg-white dark:bg-[#262626] rounded-lg border border-[#DDDDDD] dark:border-[#000000]">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-[#262626] dark:text-white">
                        {dictionary.settings?.language || 'Language'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {dictionary.settings?.languageDesc || 'Choose your preferred language'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#FF5F02]">
                        {locale === 'ar' ? 'العربية' : 'English'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Theme Settings */}
                <div className="p-4 bg-white dark:bg-[#262626] rounded-lg border border-[#DDDDDD] dark:border-[#000000]">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-[#262626] dark:text-white">
                        {dictionary.settings?.theme || 'Theme'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {dictionary.settings?.themeDesc || 'Choose your preferred theme mode'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#FF5F02]">
                        {dictionary.settings?.system || 'System'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Time Zone */}
                <div className="p-4 bg-white dark:bg-[#262626] rounded-lg border border-[#DDDDDD] dark:border-[#000000]">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-[#262626] dark:text-white">
                        {dictionary.settings?.timezone || 'Time Zone'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {dictionary.settings?.timezoneDesc || 'Set your local time zone'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#FF5F02]">
                        {Intl.DateTimeFormat().resolvedOptions().timeZone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date Format */}
                <div className="p-4 bg-white dark:bg-[#262626] rounded-lg border border-[#DDDDDD] dark:border-[#000000]">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-[#262626] dark:text-white">
                        {dictionary.settings?.dateFormat || 'Date Format'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {dictionary.settings?.dateFormatDesc || 'Choose how dates are displayed'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#FF5F02]">
                        {new Date().toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Application Version */}
                <div className="p-4 bg-[#DDDDDD] dark:bg-[#000000] rounded-lg border border-[#DDDDDD] dark:border-[#000000]">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-[#262626] dark:text-white">
                        {dictionary.settings?.version || 'Application Version'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {dictionary.settings?.versionDesc || 'Current version of the application'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#FF5F02]">
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
