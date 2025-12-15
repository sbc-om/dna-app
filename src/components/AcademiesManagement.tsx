'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, Plus, UserPlus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import toast from 'react-hot-toast';
import {
  createAcademyAction,
  assignExistingAcademyManagerAction,
  getEligibleAcademyManagersAction,
  getAllAcademiesAction,
  setCurrentAcademyAction,
} from '@/lib/actions/academyActions';

type Academy = {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  isActive: boolean;
};

type AcademyManagerSummary = {
  userId: string;
  email: string;
  username: string;
  fullName?: string;
  role: string;
};

type EligibleManagerUser = {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  role: string;
};

export function AcademiesManagement(props: { locale: string; dictionary: any }) {
  const { locale, dictionary } = props;

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [managersByAcademyId, setManagersByAcademyId] = useState<Record<string, AcademyManagerSummary | null>>({});

  const [academyForm, setAcademyForm] = useState({ name: '', nameAr: '', slug: '' });

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedAcademyId, setSelectedAcademyId] = useState<string | null>(null);
  const [eligibleManagersLoading, setEligibleManagersLoading] = useState(false);
  const [eligibleManagers, setEligibleManagers] = useState<EligibleManagerUser[]>([]);
  const [selectedManagerUserId, setSelectedManagerUserId] = useState<string>('');

  const title = useMemo(() => dictionary.settings?.academies || 'Academies', [dictionary]);

  const load = async () => {
    setLoading(true);
    try {
      const result = await getAllAcademiesAction();
      if (result.success) {
        setAcademies(result.academies as Academy[]);
        setManagersByAcademyId(((result as any).managersByAcademyId || {}) as Record<string, AcademyManagerSummary | null>);
      } else {
        toast.error(result.error || 'Failed to load academies');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load academies');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateAcademy = async () => {
    if (!academyForm.name.trim() || !academyForm.nameAr.trim()) {
      toast.error('Name and Arabic name are required');
      return;
    }

    setCreating(true);
    try {
      const result = await createAcademyAction({
        name: academyForm.name.trim(),
        nameAr: academyForm.nameAr.trim(),
        slug: academyForm.slug.trim() || undefined,
      });

      if (result.success) {
        toast.success('Academy created');
        setAcademyForm({ name: '', nameAr: '', slug: '' });
        await load();
      } else {
        toast.error(result.error || 'Failed to create academy');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to create academy');
    }
    setCreating(false);
  };

  const ensureEligibleManagersLoaded = async () => {
    if (eligibleManagers.length > 0) return;
    setEligibleManagersLoading(true);
    try {
      const result = await getEligibleAcademyManagersAction();
      if (result.success) {
        setEligibleManagers((result.users || []) as EligibleManagerUser[]);
      } else {
        toast.error(result.error || 'Failed to load eligible managers');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load eligible managers');
    }
    setEligibleManagersLoading(false);
  };

  const openAssignManager = async (academyId: string) => {
    setSelectedAcademyId(academyId);
    const existing = managersByAcademyId[academyId];
    setSelectedManagerUserId(existing?.userId || '');
    setAssignDialogOpen(true);

    await ensureEligibleManagersLoaded();
  };

  const handleAssignManager = async () => {
    if (!selectedAcademyId) return;

    const userId = selectedManagerUserId.trim();
    if (!userId) {
      toast.error('Please select a user');
      return;
    }

    setAssigning(true);
    try {
      const result = await assignExistingAcademyManagerAction({ academyId: selectedAcademyId, userId });

      if (result.success) {
        toast.success('Manager assigned');
        setAssignDialogOpen(false);
        setSelectedAcademyId(null);
        await load();
      } else {
        toast.error(result.error || 'Failed to assign manager');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to assign manager');
    }
    setAssigning(false);
  };

  const handleSetCurrent = async (academyId: string) => {
    try {
      const result = await setCurrentAcademyAction(locale, academyId);
      if (result.success) {
        toast.success('Current academy updated');
      } else {
        toast.error(result.error || 'Failed to set current academy');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to set current academy');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600 dark:text-gray-400">{dictionary.common?.loading || 'Loading...'}</p>
      </div>
    );
  }

  return (
    <>
      <Card className="border-2 border-[#DDDDDD] dark:border-[#000000] overflow-hidden">
        <CardHeader className="bg-gray-50 dark:bg-[#1a1a1a] border-b-2 border-[#DDDDDD] dark:border-[#000000] py-4">
          <CardTitle className="text-xl font-bold text-[#262626] dark:text-white flex items-center gap-3">
            <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg">
              <Building2 className="h-5 w-5 text-[#262626] dark:text-white" />
            </div>
            {title}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6 bg-white dark:bg-[#262626] space-y-6">
          {/* Create academy */}
          <div className="p-5 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#262626] dark:text-white font-semibold">Name (English)</Label>
                <Input
                  value={academyForm.name}
                  onChange={(e) => setAcademyForm((p) => ({ ...p, name: e.target.value }))}
                  className="h-12 bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-black/30 dark:focus:border-white/20"
                  placeholder="e.g. DNA Academy Riyadh"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#262626] dark:text-white font-semibold">Name (Arabic)</Label>
                <Input
                  value={academyForm.nameAr}
                  onChange={(e) => setAcademyForm((p) => ({ ...p, nameAr: e.target.value }))}
                  className="h-12 bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-black/30 dark:focus:border-white/20"
                  placeholder="Localized name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#262626] dark:text-white font-semibold">Slug (optional)</Label>
                <Input
                  value={academyForm.slug}
                  onChange={(e) => setAcademyForm((p) => ({ ...p, slug: e.target.value }))}
                  className="h-12 bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-black/30 dark:focus:border-white/20"
                  placeholder="e.g. riyadh"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleCreateAcademy}
                disabled={creating}
                className="h-12 bg-[#262626] hover:bg-black text-white active:scale-95 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                {creating ? (dictionary.common?.loading || 'Loading...') : 'Create Academy'}
              </Button>
            </div>
          </div>

          {/* List academies */}
          <div className="space-y-3">
            {academies.map((a) => (
              <div
                key={a.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-[#1a1a1a] rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="font-bold text-[#262626] dark:text-white truncate">{a.name}</p>
                    {a.isActive ? (
                      <span className="text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/30 px-2 py-1 rounded">Active</span>
                    ) : (
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30 px-2 py-1 rounded">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{a.nameAr}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 truncate">{a.slug}</p>

                  <div className="mt-2">
                    {managersByAcademyId[a.id] ? (
                      <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                        <span className="font-semibold text-gray-900 dark:text-white">Manager:</span>{' '}
                        {managersByAcademyId[a.id]?.fullName ? `${managersByAcademyId[a.id]?.fullName} · ` : ''}
                        {managersByAcademyId[a.id]?.email}
                        {managersByAcademyId[a.id]?.username ? ` · ${managersByAcademyId[a.id]?.username}` : ''}
                        {managersByAcademyId[a.id]?.role ? ` · ${managersByAcademyId[a.id]?.role}` : ''}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Manager:</span> Not assigned
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => handleSetCurrent(a.id)}
                    className="h-10 border-2 border-[#DDDDDD] dark:border-[#000000] hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2 text-gray-700 dark:text-gray-200" />
                    Set Current
                  </Button>

                  <Button
                    onClick={() => void openAssignManager(a.id)}
                    className="h-10 bg-[#262626] hover:bg-black text-white active:scale-95 transition-colors"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Manager
                  </Button>
                </div>
              </div>
            ))}

            {academies.length === 0 && (
              <div className="text-center py-12 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                <Building2 className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">No academies yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={assignDialogOpen}
        onOpenChange={(open) => {
          setAssignDialogOpen(open);
          if (!open) {
            setSelectedAcademyId(null);
            setSelectedManagerUserId('');
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px] bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#262626] dark:text-white">Assign Academy Manager</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#262626] dark:text-white font-semibold">Select a user</Label>
              <Select value={selectedManagerUserId} onValueChange={setSelectedManagerUserId}>
                <SelectTrigger className="h-12 w-full bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-black/30 dark:focus:border-white/20">
                  <SelectValue placeholder={eligibleManagersLoading ? 'Loading...' : 'Choose an admin/manager user'} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
                  {eligibleManagers.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      {eligibleManagersLoading ? 'Loading...' : 'No eligible users found'}
                    </SelectItem>
                  ) : (
                    eligibleManagers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {(u.fullName ? `${u.fullName} · ` : '') + u.email + (u.username ? ` · ${u.username}` : '') + (u.role ? ` · ${u.role}` : '')}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Only active users with role <span className="font-semibold">admin</span> or <span className="font-semibold">manager</span> can be assigned.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAssignDialogOpen(false);
                setSelectedAcademyId(null);
              }}
              className="h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000]"
            >
              {dictionary.common?.cancel || 'Cancel'}
            </Button>
            <Button
              onClick={handleAssignManager}
              disabled={assigning}
              className="h-12 bg-[#262626] hover:bg-black text-white active:scale-95 transition-colors"
            >
              {assigning ? (dictionary.common?.loading || 'Loading...') : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
