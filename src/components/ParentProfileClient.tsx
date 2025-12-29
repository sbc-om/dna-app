'use client';

import { useState } from 'react';
import { User, Plus, Mail, Phone, UserCircle, Calendar, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlayerPreviewCard } from '@/components/PlayerPreviewCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import type { User as UserType } from '@/lib/db/repositories/userRepository';
import { createUserAction } from '@/lib/actions/userActions';

interface ParentProfileClientProps {
  dictionary: Dictionary;
  locale: Locale;
  parent: UserType | any;
  children: UserType[] | any[];
  currentUser: UserType | any;
}

export function ParentProfileClient({
  dictionary,
  locale,
  parent,
  children: initialChildren,
  currentUser,
}: ParentProfileClientProps) {
  const [children, setChildren] = useState(initialChildren);
  const [addChildOpen, setAddChildOpen] = useState(false);
  const [childData, setChildData] = useState({
    fullName: '',
    nationalId: '',
    birthDate: '',
  });
  const [loading, setLoading] = useState(false);

  const cardShell =
    'bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] rounded-2xl shadow-lg relative overflow-hidden';
  const subtleText = 'text-gray-600 dark:text-gray-400';
  const inputClass =
    'h-12 bg-white dark:bg-[#111114] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500';
  const outlineButtonClass =
    'h-12 border-2 border-[#DDDDDD] dark:border-[#000000] bg-white/80 dark:bg-[#111114] text-[#262626] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a1a1d]';

  const handleAddChild = async () => {
    if (!childData.fullName || !childData.nationalId || !childData.birthDate) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    // Create child account with national ID as username
    const result = await createUserAction({
      email: `${childData.nationalId}@player.local`, // Using national ID as part of email
      username: childData.nationalId,
      fullName: childData.fullName,
      nationalId: childData.nationalId,
      password: '11111111',
      role: 'player',
      parentId: parent.id,
      birthDate: childData.birthDate,
    }, { locale });

    setLoading(false);

    if (result.success) {
      alert(`Child account created successfully!\n\nNational ID: ${childData.nationalId}\nPassword: 11111111`);
      setChildren([...children, result.user!]);
      setAddChildOpen(false);
      setChildData({ fullName: '', nationalId: '', birthDate: '' });
      // Reload page to refresh data
      window.location.reload();
    } else {
      alert(`Failed to create child account: ${result.error}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
      className="space-y-6"
    >
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-br from-slate-950 via-indigo-950 to-purple-950 p-6 sm:p-8 shadow-lg">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -left-24 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        </div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white truncate">
              {dictionary.users.parentProfile || 'Parent Profile'}
            </h1>
            <p className="mt-2 text-white/70 font-semibold">
              {dictionary.users.viewParentDetails || 'View and manage parent and their children'}
            </p>
            <p className="mt-3 text-white font-bold truncate">{parent.fullName || parent.username}</p>
            <p className="text-white/70 text-sm truncate">{parent.email}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-white/10 border-2 border-white/15 backdrop-blur-xl px-4 py-2 shadow-lg">
              <div className="flex items-center gap-2 text-xs text-white/80">
                <Shield className="h-4 w-4 text-emerald-200" />
                <span className="font-semibold">{dictionary.users?.role || 'Role'}:</span>
                <span className="font-extrabold text-white">{dictionary.users.roles?.parent || 'Parent'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Parent info */}
      <Card className={cardShell}>
        <CardHeader className="bg-gray-50 dark:bg-[#1a1a1a] border-b-2 border-[#DDDDDD] dark:border-[#000000]">
          <CardTitle className="text-base font-extrabold text-[#262626] dark:text-white flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            {dictionary.users.accountInformation || 'Account Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-gray-50 dark:bg-[#1a1a1a] p-4">
              <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <div className="min-w-0">
                <p className={`text-xs font-semibold ${subtleText}`}>{dictionary.common.email}</p>
                <p className="text-sm font-extrabold text-[#262626] dark:text-white truncate">{parent.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-gray-50 dark:bg-[#1a1a1a] p-4">
              <Phone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <div className="min-w-0">
                <p className={`text-xs font-semibold ${subtleText}`}>{dictionary.common.phoneNumber}</p>
                <p className="text-sm font-extrabold text-[#262626] dark:text-white truncate">{parent.phoneNumber || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-gray-50 dark:bg-[#1a1a1a] p-4">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <div className="min-w-0">
                <p className={`text-xs font-semibold ${subtleText}`}>{dictionary.users.createdAt || 'Created At'}</p>
                <p className="text-sm font-extrabold text-[#262626] dark:text-white truncate">
                  {new Date(parent.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-gray-50 dark:bg-[#1a1a1a] p-4">
              <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <div className="min-w-0">
                <p className={`text-xs font-semibold ${subtleText}`}>{dictionary.users.status || 'Status'}</p>
                <Badge variant={parent.isActive ? 'default' : 'destructive'} className="mt-1">
                  {parent.isActive ? (dictionary.users.active || 'Active') : (dictionary.users.inactive || 'Inactive')}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Children */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {dictionary.users.children || 'Children'} ({children.length})
            </h2>
            <p className="text-sm text-slate-600 dark:text-white/60 font-semibold">
              {dictionary.users.childrenHint || 'Players linked to this parent'}
            </p>
          </div>

          {(currentUser.role === 'admin' || currentUser.id === parent.id) && (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                onClick={() => setAddChildOpen(true)}
                className="h-12 px-5 bg-[#0b0b0f] text-white hover:bg-[#14141a] border-2 border-transparent font-bold shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                {dictionary.users.addChild || 'Add Child'}
              </Button>
            </motion.div>
          )}
        </div>

        {children.length === 0 ? (
          <Card className={`${cardShell} p-8 text-center`}>
            <p className="text-[#262626] dark:text-white font-semibold">
              {dictionary.users.noChildren || 'No children added yet'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <PlayerPreviewCard key={child.id} locale={locale} dictionary={dictionary} child={child} />
            ))}
          </div>
        )}
      </div>

      {/* Add Child Dialog */}
      <Dialog open={addChildOpen} onOpenChange={setAddChildOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#262626] dark:text-white">
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
            </DialogTitle>
            <DialogDescription>
              {dictionary.users.addChildDescription || 'Add a new child for this parent. Default password is 11111111.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="fullName">{dictionary.common.fullName}</Label>
              <Input
                id="fullName"
                value={childData.fullName}
                onChange={(e) => setChildData({ ...childData, fullName: e.target.value })}
                placeholder={dictionary.users.fullNamePlaceholder || 'Enter child full name'}
              />
            </div>
            <div>
                    className={inputClass}
              <Label htmlFor="nationalId">{dictionary.users.nationalId || 'National ID'}</Label>
              <Input
                id="nationalId"
                value={childData.nationalId}
                onChange={(e) => setChildData({ ...childData, nationalId: e.target.value })}
                placeholder={dictionary.users.nationalIdPlaceholder || 'Enter national ID number'}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {dictionary.users.nationalIdNote || 'This will be used as the login username'}
                    className={inputClass}
              </p>
            </div>
            <div>
              <Label htmlFor="birthDate">{dictionary.dashboard?.academyAdmin?.birthDate || 'Birth date'}</Label>
              <Input
                id="birthDate"
                type="date"
                value={childData.birthDate}
                onChange={(e) => setChildData({ ...childData, birthDate: e.target.value })}
              />
            </div>
            <div className="bg-[#DDDDDD] dark:bg-[#262626] p-3 rounded-lg">
                    className={inputClass}
              <p className="text-sm font-semibold text-[#262626] dark:text-white">
                {dictionary.users.defaultPassword || 'Default Password'}: 11111111
                <div className="p-3 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-gray-50 dark:bg-[#1a1a1a]">
                  <p className={`text-sm font-semibold text-[#262626] dark:text-white`}>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddChildOpen(false)} disabled={loading}>
              {dictionary.common.cancel}
            </Button>
                <Button variant="outline" onClick={() => setAddChildOpen(false)} disabled={loading} className={outlineButtonClass}>
              onClick={handleAddChild}
              className="bg-[#FF5F02] hover:bg-[#262626] text-white"
              disabled={loading}
            >
              {loading ? dictionary.common.loading : (dictionary.users.addChild || 'Add Child')}
                  className="h-12 bg-[#0b0b0f] text-white hover:bg-[#14141a]"
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
