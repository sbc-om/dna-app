'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Send, Users, MessageSquare, CheckCircle, XCircle, AlertCircle, Save, Trash2, Pencil, UsersIcon, Folder } from 'lucide-react';
import { Dictionary } from '@/lib/i18n/getDictionary';

interface User {
  id: string;
  fullName?: string;
  email: string;
  phoneNumber?: string;
  role: string;
}

interface WhatsAppMessagingClientProps {
  dictionary: Dictionary;
  locale: string;
}

type WhatsAppRecipientProfile = {
  id: string;
  name: string;
  userIds: string[];
  createdAt: string;
  updatedAt: string;
};

type WhatsAppGroup = {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  memberIds: string[];
  phoneNumbers: string[];
  createdBy: string;
  academyId?: string;
  createdAt: string;
  updatedAt: string;
};

type WhatsAppSendResults = {
  success: number;
  failed: number;
};

export default function WhatsAppMessagingClient({ dictionary, locale }: WhatsAppMessagingClientProps) {
  const t = dictionary.whatsapp;

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [session, setSession] = useState('Milad');
  const [wahaUrl, setWahaUrl] = useState('http://localhost:3000');
  const [wahaApiKey, setWahaApiKey] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(true);
  const [sendResults, setSendResults] = useState<WhatsAppSendResults | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const [profiles, setProfiles] = useState<WhatsAppRecipientProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [isFetchingProfiles, setIsFetchingProfiles] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileDialogMode, setProfileDialogMode] = useState<'create' | 'edit'>('create');
  const [profileName, setProfileName] = useState('');

  // WhatsApp Groups State
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [isFetchingGroups, setIsFetchingGroups] = useState(true);
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupDialogMode, setGroupDialogMode] = useState<'create' | 'edit'>('create');
  const [groupName, setGroupName] = useState('');
  const [groupNameAr, setGroupNameAr] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupDescriptionAr, setGroupDescriptionAr] = useState('');
  
  const [currentTab, setCurrentTab] = useState<'users' | 'groups'>('users');

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
    fetchProfiles();
    fetchGroups();
  }, []);

  // Filter users based on role and search query
  useEffect(() => {
    let filtered = users;

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.fullName?.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phoneNumber?.includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [users, roleFilter, searchQuery]);

  const fetchUsers = async () => {
    try {
      setIsFetchingUsers(true);
      setErrorMessage('');
      const response = await fetch('/api/users');
      
      if (response.ok) {
        const data = await response.json();
        // Filter users with phone numbers only
        const usersWithPhone = data.users.filter((user: User) => user.phoneNumber);
        setUsers(usersWithPhone);
        setFilteredUsers(usersWithPhone);
      } else {
        setErrorMessage(t?.errors?.fetchUsersFailed || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setErrorMessage(t?.errors?.fetchUsersFailed || 'Failed to fetch users');
    } finally {
      setIsFetchingUsers(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      setIsFetchingProfiles(true);
      const response = await fetch('/api/whatsapp/profiles');
      const data = await response.json();
      if (response.ok && data?.success) {
        setProfiles(data.profiles || []);
      } else {
        // Keep silent; page should still work without profiles.
      }
    } catch (error) {
      console.error('Error fetching WhatsApp profiles:', error);
    } finally {
      setIsFetchingProfiles(false);
    }
  };

  const fetchGroups = async () => {
    try {
      setIsFetchingGroups(true);
      const response = await fetch('/api/whatsapp/groups');
      const data = await response.json();
      if (response.ok && data?.success) {
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp groups:', error);
    } finally {
      setIsFetchingGroups(false);
    }
  };

  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === selectedProfileId) || null,
    [profiles, selectedProfileId]
  );

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId) || null,
    [groups, selectedGroupId]
  );

  const applyProfileSelection = (profileId: string) => {
    setSelectedProfileId(profileId);
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) return;
    setSelectedUsers(new Set(profile.userIds));
  };

  const applyGroupSelection = (groupId: string) => {
    setSelectedGroupId(groupId);
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    setSelectedUsers(new Set(group.memberIds));
  };

  const openCreateProfile = () => {
    setProfileDialogMode('create');
    setProfileName('');
    setProfileDialogOpen(true);
  };

  const openEditProfile = () => {
    if (!selectedProfile) return;
    setProfileDialogMode('edit');
    setProfileName(selectedProfile.name);
    setProfileDialogOpen(true);
  };

  const openCreateGroup = () => {
    setGroupDialogMode('create');
    setGroupName('');
    setGroupNameAr('');
    setGroupDescription('');
    setGroupDescriptionAr('');
    setGroupDialogOpen(true);
  };

  const openEditGroup = () => {
    if (!selectedGroup) return;
    setGroupDialogMode('edit');
    setGroupName(selectedGroup.name);
    setGroupNameAr(selectedGroup.nameAr || '');
    setGroupDescription(selectedGroup.description || '');
    setGroupDescriptionAr(selectedGroup.descriptionAr || '');
    setGroupDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    const name = profileName.trim();
    if (!name) {
      setErrorMessage(t?.errors?.profileNameRequired || 'Profile name is required');
      return;
    }
    if (selectedUsers.size === 0) {
      setErrorMessage(t?.errors?.selectAtLeastOneUser || 'Please select at least one user');
      return;
    }

    setIsSavingProfile(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const userIds = Array.from(selectedUsers);
      const isEdit = profileDialogMode === 'edit' && selectedProfile;
      const url = isEdit ? `/api/whatsapp/profiles/${selectedProfile!.id}` : '/api/whatsapp/profiles';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, userIds }),
      });
      const data = await response.json();

      if (response.ok && data?.success) {
        await fetchProfiles();
        const newId = data.profile?.id || selectedProfile?.id;
        if (newId) setSelectedProfileId(newId);
        setProfileDialogOpen(false);
        setSuccessMessage(
          isEdit
            ? (t?.status?.profileUpdated || 'Profile updated')
            : (t?.status?.profileCreated || 'Profile created')
        );
      } else {
        setErrorMessage(data?.message || (t?.errors?.saveProfileFailed || 'Failed to save profile'));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrorMessage(t?.errors?.saveProfileFailed || 'Failed to save profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!selectedProfile) return;
    setIsDeletingProfile(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await fetch(`/api/whatsapp/profiles/${selectedProfile.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok && data?.success) {
        setSelectedProfileId('');
        await fetchProfiles();
        setSuccessMessage(t?.status?.profileDeleted || 'Profile deleted');
      } else {
        setErrorMessage(data?.message || (t?.errors?.deleteProfileFailed || 'Failed to delete profile'));
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      setErrorMessage(t?.errors?.deleteProfileFailed || 'Failed to delete profile');
    } finally {
      setIsDeletingProfile(false);
    }
  };

  const handleSaveGroup = async () => {
    const name = groupName.trim();
    if (!name) {
      setErrorMessage(t?.errors?.groupNameRequired || 'Group name is required');
      return;
    }
    if (selectedUsers.size === 0) {
      setErrorMessage(t?.errors?.selectAtLeastOneUser || 'Please select at least one user');
      return;
    }

    setIsSavingGroup(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const memberIds = Array.from(selectedUsers);
      const isEdit = groupDialogMode === 'edit' && selectedGroup;
      const url = isEdit ? `/api/whatsapp/groups/${selectedGroup!.id}` : '/api/whatsapp/groups';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          nameAr: groupNameAr.trim() || undefined,
          description: groupDescription.trim() || undefined,
          descriptionAr: groupDescriptionAr.trim() || undefined,
          memberIds,
        }),
      });
      const data = await response.json();

      if (response.ok && data?.success) {
        await fetchGroups();
        const newId = data.group?.id || selectedGroup?.id;
        if (newId) setSelectedGroupId(newId);
        setGroupDialogOpen(false);
        setSuccessMessage(
          isEdit
            ? (t?.status?.groupUpdated || 'Group updated')
            : (t?.status?.groupCreated || 'Group created')
        );
      } else {
        setErrorMessage(data?.message || (t?.errors?.saveGroupFailed || 'Failed to save group'));
      }
    } catch (error) {
      console.error('Error saving group:', error);
      setErrorMessage(t?.errors?.saveGroupFailed || 'Failed to save group');
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    setIsDeletingGroup(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await fetch(`/api/whatsapp/groups/${selectedGroup.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok && data?.success) {
        setSelectedGroupId('');
        await fetchGroups();
        setSuccessMessage(t?.status?.groupDeleted || 'Group deleted');
      } else {
        setErrorMessage(data?.message || (t?.errors?.deleteGroupFailed || 'Failed to delete group'));
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      setErrorMessage(t?.errors?.deleteGroupFailed || 'Failed to delete group');
    } finally {
      setIsDeletingGroup(false);
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
    }
  };

  const handleSendMessages = async () => {
    // Check if sending to group or individual users
    const hasSelection = currentTab === 'groups' ? selectedGroupId : selectedUsers.size > 0;
    
    if (!hasSelection) {
      setErrorMessage(
        currentTab === 'groups'
          ? (t?.selectGroup || 'Please select a group')
          : (t?.errors?.selectAtLeastOneUser || 'Please select at least one user')
      );
      return;
    }

    if (!message.trim()) {
      setErrorMessage(t?.errors?.enterMessage || 'Please enter a message');
      return;
    }

    setIsLoading(true);
    setSendResults(null);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let phoneNumbers: Array<{ phoneNumber: string; name: string }> = [];

      if (currentTab === 'groups' && selectedGroupId) {
        // Send to group
        const group = groups.find(g => g.id === selectedGroupId);
        if (group) {
          // Get user details for group members
          const selectedUsersList = users.filter(user => group.memberIds.includes(user.id));
          phoneNumbers = selectedUsersList.map(user => ({
            phoneNumber: user.phoneNumber!,
            name: user.fullName || user.email,
          }));
        }
      } else {
        // Send to individual users
        const selectedUsersList = users.filter(user => selectedUsers.has(user.id));
        phoneNumbers = selectedUsersList.map(user => ({
          phoneNumber: user.phoneNumber!,
          name: user.fullName || user.email,
        }));
      }

      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumbers,
          message,
          session,
          wahaUrl,
          wahaApiKey,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const rawResults = (data?.data ?? {}) as Partial<WhatsAppSendResults>;
        setSendResults({
          success: Number(rawResults.success ?? 0),
          failed: Number(rawResults.failed ?? 0),
        });
        setSuccessMessage(data.message);
        setMessage('');
        if (currentTab === 'users') {
          setSelectedUsers(new Set());
        }
      } else {
        setErrorMessage(data.message || (t?.errors?.sendFailed || 'Failed to send messages'));
      }
    } catch (error) {
      console.error('Error sending messages:', error);
      setErrorMessage(t?.errors?.sendFailed || 'Failed to send messages');
    } finally {
      setIsLoading(false);
    }
  };

  const uniqueRoles = Array.from(new Set(users.map(user => user.role)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
      className="container mx-auto py-6 px-4 max-w-7xl"
    >
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/35">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-emerald-500/10 via-cyan-500/10 to-purple-500/10" />
        <div className="relative flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, -6, 6, -6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.5 }}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15"
          >
            <MessageSquare className="h-5 w-5 text-emerald-300" />
          </motion.div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
              {t?.title || 'WhatsApp Messaging'}
            </h1>
            <p className="mt-1 text-sm text-white/70">
              {t?.subtitle || 'Send WhatsApp messages to selected users'}
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-950 border border-red-500 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800 dark:text-red-200">{errorMessage}</p>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-950 border border-green-500 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users/Groups List */}
        <Card className="lg:col-span-2 bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] shadow-lg">
          <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as 'users' | 'groups')} className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-[#1a1a1a]">
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t?.usersTab || 'Users'}
                  {currentTab === 'users' && filteredUsers.length > 0 && (
                    <span className="text-xs">({selectedUsers.size}/{filteredUsers.length})</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="groups" className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  {t?.groupsTab || 'Groups'}
                  {currentTab === 'groups' && groups.length > 0 && (
                    <span className="text-xs">({groups.length})</span>
                  )}
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
            {/* Users Tab */}
            <TabsContent value="users" className="mt-0 space-y-4">
            {/* Profiles */}
            <div className="p-4 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-gray-50 dark:bg-[#1a1a1a]">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="flex-1">
                  <Label className="text-[#262626] dark:text-white font-semibold">
                    {t?.recipientProfiles || 'Recipient Profiles'}
                  </Label>
                  <div className="mt-2">
                    <Select
                      value={selectedProfileId || 'none'}
                      onValueChange={(v) => {
                        if (v === 'none') {
                          setSelectedProfileId('');
                          return;
                        }
                        applyProfileSelection(v);
                      }}
                    >
                      <SelectTrigger className="w-full h-12 bg-white dark:bg-[#0a0a0a] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white">
                        <SelectValue
                          placeholder={
                            isFetchingProfiles
                              ? (t?.loadingProfiles || t?.loading || 'Loading...')
                              : (t?.selectProfile || 'Select a profile')
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
                        <SelectItem value="none" className="text-[#262626] dark:text-white cursor-pointer">
                          {t?.none || 'None'}
                        </SelectItem>
                        {profiles.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="text-[#262626] dark:text-white cursor-pointer">
                            {p.name} ({p.userIds.length})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedProfile && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {selectedProfile.userIds.length} {t?.recipients || 'recipients'}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openCreateProfile}
                    className="h-12 border-2"
                    disabled={isSavingProfile}
                  >
                    <Save className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {t?.saveProfile || 'Save Profile'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openEditProfile}
                    className="h-12 border-2"
                    disabled={!selectedProfile || isSavingProfile}
                  >
                    <Pencil className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {t?.edit || 'Edit'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDeleteProfile}
                    className="h-12 border-2"
                    disabled={!selectedProfile || isDeletingProfile}
                  >
                    {isDeletingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span className="sr-only">Delete</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setSelectedUsers(new Set());
                      setSelectedProfileId('');
                    }}
                    className="h-12"
                  >
                    {t?.clear || 'Clear'}
                  </Button>
                </div>
              </div>

              <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {profileDialogMode === 'edit'
                          ? (t?.editProfile || 'Edit Profile')
                          : (t?.createProfile || 'Create Profile')}
                    </DialogTitle>
                    <DialogDescription>
                      {t?.profileDialogHint || 'Save a set of recipients to send messages in one click.'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[#262626] dark:text-white font-semibold">
                        {t?.profileName || 'Profile Name'}
                      </Label>
                      <Input
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder={t?.profileNamePlaceholder || 'e.g. Parents'}
                        className="h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white"
                      />
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedUsers.size} {t?.selectedUsers || 'selected users'}
                    </div>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setProfileDialogOpen(false)} className="border-2">
                      {t?.cancel || 'Cancel'}
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="bg-[#262626] hover:bg-[#1f1f1f] text-white">
                      {isSavingProfile ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2 rtl:mr-0 rtl:ml-2" />
                          {t?.saving || 'Saving...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                          {profileDialogMode === 'edit'
                            ? (t?.saveChanges || 'Save Changes')
                            : (t?.create || 'Create')}
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Filters */}
<div className="flex flex-col sm:flex-row gap-4 mb-4">
  {/* Search Input */}
  <div className="flex-1">
    <Input
      placeholder={t?.search || 'Search...'}
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="
        h-12 flex items-center py-2 text-sm
        bg-white dark:bg-[#1a1a1a]
        border-2 border-[#DDDDDD] dark:border-[#000000]
        focus:border-[#FF5F02] dark:focus:border-[#FF5F02]
        text-[#262626] dark:text-white
        placeholder:text-gray-400 dark:placeholder:text-gray-500
      "
    />
  </div>

  {/* Role Filter */}
  <Select value={roleFilter} onValueChange={setRoleFilter}>
    <SelectTrigger
      className="
        w-full sm:w-[200px] h-12 flex items-center py-2
        bg-white dark:bg-[#1a1a1a]
        border-2 border-[#DDDDDD] dark:border-[#000000]
        focus:border-[#FF5F02] dark:focus:border-[#FF5F02]
        text-[#262626] dark:text-white
        hover:bg-gray-50 dark:hover:bg-[#0a0a0a]
      "
    >
      <SelectValue
        placeholder={t?.filterByRole || 'Filter by role'}
      />
    </SelectTrigger>

    <SelectContent
      className="
        bg-white dark:bg-[#262626]
        border-2 border-[#DDDDDD] dark:border-[#000000]
      "
    >
      <SelectItem
        value="all"
        className="
          text-[#262626] dark:text-white
          hover:bg-[#FF5F02]/10 dark:hover:bg-[#FF5F02]/20
          cursor-pointer
        "
      >
        {t?.all || 'All'}
      </SelectItem>

      {uniqueRoles.map((role) => (
        <SelectItem
          key={role}
          value={role}
          className="
            text-[#262626] dark:text-white
            hover:bg-[#FF5F02]/10 dark:hover:bg-[#FF5F02]/20
            cursor-pointer
          "
        >
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>


            {/* Select All */}
            {filteredUsers.length > 0 && (
              <div className="flex items-center space-x-2 rtl:space-x-reverse mb-4 pb-4 border-b">
                <Checkbox
                  id="select-all"
                  checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="cursor-pointer font-medium text-[#262626] dark:text-white">
                  {t?.selectAll || 'Select All'}
                </Label>
              </div>
            )}

            {/* Users List */}
            {isFetchingUsers ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t?.noUsersFound || 'No users found'}
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-custom-dark pr-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={() => handleSelectUser(user.id)}
                    />
                    <Label
                      htmlFor={`user-${user.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium text-[#262626] dark:text-white">{user.fullName || user.email}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span>{user.phoneNumber}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                          {user.role}
                        </span>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
            </TabsContent>

            {/* Groups Tab */}
            <TabsContent value="groups" className="mt-0 space-y-4">
              {/* Groups Management */}
              <div className="p-4 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-gray-50 dark:bg-[#1a1a1a]">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                  <div className="flex-1">
                    <Label className="text-[#262626] dark:text-white font-semibold">
                      {t?.whatsappGroups || 'WhatsApp Groups'}
                    </Label>
                    <div className="mt-2">
                      <Select
                        value={selectedGroupId || 'none'}
                        onValueChange={(v) => {
                          if (v === 'none') {
                            setSelectedGroupId('');
                            setSelectedUsers(new Set());
                            return;
                          }
                          applyGroupSelection(v);
                        }}
                      >
                        <SelectTrigger className="w-full h-12 bg-white dark:bg-[#0a0a0a] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white">
                          <SelectValue
                            placeholder={
                              isFetchingGroups
                                ? (t?.loadingGroups || t?.loading || 'Loading...')
                                : (t?.selectGroup || 'Select a group')
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
                          <SelectItem value="none" className="text-[#262626] dark:text-white cursor-pointer">
                            {t?.none || 'None'}
                          </SelectItem>
                          {groups.map((g) => (
                            <SelectItem key={g.id} value={g.id} className="text-[#262626] dark:text-white cursor-pointer">
                              {locale === 'ar' && g.nameAr ? g.nameAr : g.name} ({g.memberIds.length} {t?.members || 'members'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedGroup && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedGroup.memberIds.length} {t?.members || 'members'}
                        </p>
                        {selectedGroup.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {locale === 'ar' && selectedGroup.descriptionAr ? selectedGroup.descriptionAr : selectedGroup.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openCreateGroup}
                      className="h-12 border-2"
                      disabled={isSavingGroup}
                    >
                      <Save className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                      {t?.newGroup || 'New Group'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openEditGroup}
                      className="h-12 border-2"
                      disabled={!selectedGroup || isSavingGroup}
                    >
                      <Pencil className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                      {t?.edit || 'Edit'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDeleteGroup}
                      className="h-12 border-2"
                      disabled={!selectedGroup || isDeletingGroup}
                    >
                      {isDeletingGroup ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>

                {/* Group Dialog */}
                <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
                  <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {groupDialogMode === 'edit'
                          ? (t?.editGroup || 'Edit Group')
                          : (t?.createNewGroup || 'Create New Group')}
                      </DialogTitle>
                      <DialogDescription>
                        {t?.groupDialogHint || 'Save a group of users to send WhatsApp messages quickly'}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[#262626] dark:text-white font-semibold">
                          {t?.groupNameEn || 'Group Name (EN)'}
                        </Label>
                        <Input
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          placeholder={t?.groupNameEnPlaceholder || 'e.g. Parents Group'}
                          className="h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[#262626] dark:text-white font-semibold">
                          {t?.groupNameAr || 'Group Name (AR)'}
                        </Label>
                        <Input
                          value={groupNameAr}
                          onChange={(e) => setGroupNameAr(e.target.value)}
                          placeholder={t?.groupNameArPlaceholder || 'e.g. Parents Group (AR)'}
                          className="h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[#262626] dark:text-white font-semibold">
                          {t?.descriptionEn || 'Description (EN)'}
                        </Label>
                        <Textarea
                          value={groupDescription}
                          onChange={(e) => setGroupDescription(e.target.value)}
                          placeholder={t?.optionalDescription || 'Optional description'}
                          rows={2}
                          className="bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[#262626] dark:text-white font-semibold">
                          {t?.descriptionAr || 'Description (AR)'}
                        </Label>
                        <Textarea
                          value={groupDescriptionAr}
                          onChange={(e) => setGroupDescriptionAr(e.target.value)}
                          placeholder={t?.optionalDescription || 'Optional description'}
                          rows={2}
                          className="bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white"
                        />
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedUsers.size} {t?.selectedUsers || 'selected users'}
                      </div>
                    </div>

                    <DialogFooter className="gap-2">
                      <Button variant="outline" onClick={() => setGroupDialogOpen(false)} className="border-2">
                        {t?.cancel || 'Cancel'}
                      </Button>
                      <Button onClick={handleSaveGroup} disabled={isSavingGroup} className="bg-green-600 hover:bg-green-700 text-white">
                        {isSavingGroup ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2 rtl:mr-0 rtl:ml-2" />
                            {t?.saving || 'Saving...'}
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                            {groupDialogMode === 'edit'
                              ? (t?.saveChanges || 'Save Changes')
                              : (t?.create || 'Create')}
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Groups List */}
              {isFetchingGroups ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t?.noGroupsFound || 'No groups found'}
                  <p className="text-sm mt-2">
                    {t?.createGroupHint || 'Create a new group to get started'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-custom-dark pr-2">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedGroupId === group.id
                          ? 'border-green-500 bg-green-50 dark:bg-green-950'
                          : 'border-[#DDDDDD] dark:border-[#000000] hover:border-gray-400 dark:hover:border-gray-600'
                      }`}
                      onClick={() => applyGroupSelection(group.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <UsersIcon className="h-5 w-5 text-green-600" />
                            <h3 className="font-semibold text-[#262626] dark:text-white">
                              {locale === 'ar' && group.nameAr ? group.nameAr : group.name}
                            </h3>
                          </div>
                          {group.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {locale === 'ar' && group.descriptionAr ? group.descriptionAr : group.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>{group.memberIds.length} {t?.members || 'members'}</span>
                            <span>•</span>
                            <span>{new Date(group.createdAt).toLocaleDateString(locale === 'ar' ? 'ar' : 'en')}</span>
                          </div>
                        </div>
                        {selectedGroupId === group.id && (
                          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

          </CardContent>
          </Tabs>
        </Card>

        {/* Message Form */}
        <Card className="lg:col-span-1 bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] shadow-lg">
          <CardHeader>
            <CardTitle>{t?.message || 'Message'}</CardTitle>
            <CardDescription>
              {t?.messageHint || 'Write your message here'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Selection Info */}
            {(currentTab === 'users' && selectedUsers.size > 0) || (currentTab === 'groups' && selectedGroupId) ? (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
                  {currentTab === 'users' ? (
                    <>
                      <Users className="h-4 w-4" />
                      <span className="font-semibold">{selectedUsers.size}</span>
                      <span>{t?.usersSelected || 'users selected'}</span>
                    </>
                  ) : (
                    <>
                      <UsersIcon className="h-4 w-4" />
                      <span className="font-semibold">{locale === 'ar' && selectedGroup?.nameAr ? selectedGroup.nameAr : selectedGroup?.name}</span>
                      <span>({selectedGroup?.memberIds.length} {t?.members || 'members'})</span>
                    </>
                  )}
                </div>
              </div>
            ) : null}
            
            <div className="space-y-2">
              <Label htmlFor="wahaUrl" className="text-[#262626] dark:text-white font-semibold">{t?.wahaApiUrl || 'WAHA API URL'}</Label>
              <Input
                id="wahaUrl"
                value={wahaUrl}
                onChange={(e) => setWahaUrl(e.target.value)}
                placeholder="http://localhost:3000"
                className="h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] text-[#262626] dark:text-white"
              />
              <p className="text-xs text-gray-500">
                {t?.wahaApiUrlHint || 'WAHA server URL'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wahaApiKey" className="text-[#262626] dark:text-white font-semibold">{t?.apiKey || 'API Key'}</Label>
              <Input
                id="wahaApiKey"
                type="password"
                value={wahaApiKey}
                onChange={(e) => setWahaApiKey(e.target.value)}
                placeholder={t?.apiKeyPlaceholder || 'Enter API key'}
                className="h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] text-[#262626] dark:text-white"
              />
              <p className="text-xs text-gray-500">
                {t?.apiKeyHint || 'WAHA API authentication key'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session" className="text-[#262626] dark:text-white font-semibold">{t?.session || 'Session'}</Label>
              <Input
                id="session"
                value={session}
                onChange={(e) => setSession(e.target.value)}
                placeholder="Milad"
                className="h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] text-[#262626] dark:text-white"
              />
              <p className="text-xs text-gray-500">
                {t?.sessionHint || 'WAHA session name'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-[#262626] dark:text-white font-semibold">{t?.messageText || 'Message Text'}</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t?.messagePlaceholder || 'Write your message here...'}
                rows={8}
                className="resize-none bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            <Button
              onClick={handleSendMessages}
              disabled={isLoading || (currentTab === 'users' ? selectedUsers.size === 0 : !selectedGroupId) || !message.trim()}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2 rtl:mr-0 rtl:ml-2" />
                  {t?.sending || 'Sending...'}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                  {t?.send || 'Send'}
                  {currentTab === 'users' && selectedUsers.size > 0 && ` (${selectedUsers.size})`}
                  {currentTab === 'groups' && selectedGroup && ` (${selectedGroup.memberIds.length})`}
                </>
              )}
            </Button>

            {/* Send Results */}
            {sendResults && (
              <Card className="mt-4 bg-gray-50 dark:bg-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">
                    {t?.sendResults || 'Send Results'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {t?.success || 'Success'}
                    </span>
                    <span className="font-medium">{sendResults.success}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      {t?.failed || 'Failed'}
                    </span>
                    <span className="font-medium">{sendResults.failed}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
