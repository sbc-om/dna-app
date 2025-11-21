'use client';

import { useState, useEffect } from 'react';
import { Settings, Database, Download, Upload, Trash2, Clock, Bell, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { useConfirm } from '@/components/ConfirmDialog';
import { PushNotificationSetup } from '@/components/PushNotificationSetup';
import { RolePermission } from '@/lib/db/repositories/rolePermissionRepository';
import AdminSettingsClient from '@/components/AdminSettingsClient';

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
          <h1 className="text-3xl font-bold text-[#1E3A8A] flex items-center gap-2">
            <Settings className="h-8 w-8" />
            {dictionary.nav.settings || 'Settings'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {dictionary.settings?.description || 'Manage application settings and data backup'}
          </p>
        </div>

        <Tabs defaultValue="notifications" className="space-y-4">
          <TabsList className={`grid w-full lg:w-[800px] ${permissions.canManageBackups ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {dictionary.settings?.notifications || 'Notifications'}
            </TabsTrigger>
            {permissions.canManageBackups && (
              <TabsTrigger value="backup" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                {dictionary.settings?.backupRestore || 'Backup & Restore'}
              </TabsTrigger>
            )}
            {permissions.canManageBackups && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                {dictionary.settings?.adminSettings || 'Admin Settings'}
              </TabsTrigger>
            )}
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {dictionary.settings?.general || 'General'}
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <PushNotificationSetup
              title={dictionary.settings?.pushNotifications || 'Push Notifications'}
              description={dictionary.settings?.pushNotificationsDescription || 'Get notified instantly when you receive new messages'}
            />
          </TabsContent>

          {/* Backup & Restore Tab */}
          {permissions.canManageBackups && (
          <TabsContent value="backup" className="space-y-4">
            <Card className="border-2 border-[#30B2D2]/30">
              <CardHeader className="bg-linear-to-r from-[#30B2D2]/10 to-[#1E3A8A]/10">
                <CardTitle className="text-xl font-bold text-[#1E3A8A] flex items-center gap-2">
                  <Database className="h-6 w-6" />
                  {dictionary.settings?.backupManagement || 'Backup Management'}
                </CardTitle>
                <CardDescription>
                  {dictionary.settings?.backupDescription || 'Create and manage backups of your database and uploaded files'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Create Backup */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-blue-900">
                      {dictionary.settings?.createNewBackup || 'Create New Backup'}
                    </h3>
                    <p className="text-sm text-blue-700">
                      {dictionary.settings?.createBackupDesc || 'Backup includes database and all uploaded files'}
                    </p>
                  </div>
                  <Button
                    onClick={handleCreateBackup}
                    disabled={loading}
                    className="bg-[#30B2D2] hover:bg-[#1E3A8A]"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {loading ? dictionary.common.loading : dictionary.settings?.create || 'Create'}
                  </Button>
                </div>

                {/* Restore Backup */}
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-orange-900">
                      {dictionary.settings?.restoreFromBackup || 'Restore from Backup'}
                    </h3>
                    <p className="text-sm text-orange-700">
                      {dictionary.settings?.restoreDesc || 'Upload a backup file to restore data'}
                    </p>
                  </div>
                  <Button
                    onClick={handleRestoreBackup}
                    disabled={restoring}
                    variant="destructive"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {restoring ? dictionary.common.loading : dictionary.settings?.restore || 'Restore'}
                  </Button>
                </div>

                {/* Backup List */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
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
                          className="flex items-center justify-between p-4 bg-white rounded-lg border hover:border-[#30B2D2] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Database className="h-5 w-5 text-[#30B2D2]" />
                            <div>
                              <p className="font-medium text-gray-900">{backup.filename}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(backup.timestamp.replace(/-/g, ':')).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadBackup(backup.filename)}
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

          {/* Admin Settings Tab */}
          {permissions.canManageBackups && (
          <TabsContent value="admin" className="space-y-4">
            <AdminSettingsClient locale={locale} dict={dictionary} />
          </TabsContent>
          )}

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-4">
            <Card className="border-2 border-[#30B2D2]/30">
              <CardHeader className="bg-linear-to-r from-[#30B2D2]/10 to-[#1E3A8A]/10">
                <CardTitle className="text-xl font-bold text-[#1E3A8A]">
                  {dictionary.settings?.generalSettings || 'General Settings'}
                </CardTitle>
                <CardDescription>
                  {dictionary.settings?.generalDescription || 'Configure general application settings'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-8">
                  {dictionary.settings?.comingSoon || 'More settings coming soon...'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDialog />
    </>
  );
}
