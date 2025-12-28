'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Shield, GraduationCap } from 'lucide-react';
import type { User } from '@/lib/db/repositories/userRepository';
import { ROLES, UserRole } from '@/config/roles';
import { Dictionary } from '@/lib/i18n/getDictionary';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createUserAction } from '@/lib/actions/userActions';
import { getAcademyUiContextAction } from '@/lib/actions/academyActions';
import type { Academy } from '@/lib/db/repositories/academyRepository';

export interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dictionary: Dictionary;
  onUserCreated: (user: User) => void;
  parents?: User[];
  locale: string;
  fixedRole?: UserRole;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  dictionary,
  onUserCreated,
  parents = [],
  locale,
  fixedRole,
}: CreateUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [academyId, setAcademyId] = useState<string>('');
  const [playerParentMode, setPlayerParentMode] = useState<'none' | 'existing' | 'create'>('none');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    role: (fixedRole || ROLES.PLAYER) as UserRole,
    parentId: '',
    birthDate: '',
  });

  const [parentFormData, setParentFormData] = useState({
    email: '',
    username: '',
    password: '',
    fullName: '',
    phoneNumber: '',
  });

  useEffect(() => {
    if (open) {
      loadAcademyContext();
    }
  }, [open]);

  const loadAcademyContext = async () => {
    const result = await getAcademyUiContextAction(locale);
    if (result.success) {
      setAcademies(result.academies);
      setCurrentUserRole(result.userRole as UserRole);
      setAcademyId(result.currentAcademyId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const canPickAcademy = currentUserRole === ROLES.ADMIN;

    // Construct birthDate from components
    const birthDate = formData.role === ROLES.PLAYER && birthDay && birthMonth && birthYear
      ? `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
      : formData.birthDate;

    let resolvedParentId = formData.parentId;
    if (formData.role === ROLES.PLAYER && playerParentMode === 'create') {
      const parentResult = await createUserAction(
        {
          email: parentFormData.email,
          username: parentFormData.username,
          password: parentFormData.password,
          fullName: parentFormData.fullName,
          phoneNumber: parentFormData.phoneNumber,
          role: ROLES.PARENT,
        },
        {
          locale,
          academyId: canPickAcademy ? academyId : undefined,
        }
      );

      if (!parentResult.success || !parentResult.user) {
        alert(parentResult.error || 'Failed to create parent');
        setIsSubmitting(false);
        return;
      }
      resolvedParentId = parentResult.user.id;
    }

    const result = await createUserAction(
      {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        parentId: formData.role === ROLES.PLAYER && resolvedParentId ? resolvedParentId : undefined,
        birthDate: formData.role === ROLES.PLAYER ? birthDate : undefined,
      },
      {
        locale,
        academyId: canPickAcademy ? academyId : undefined,
      }
    );

    if (result.success && result.user) {
      onUserCreated(result.user);
      onOpenChange(false);
      setFormData({
        email: '',
        username: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        role: ROLES.PLAYER,
        parentId: '',
        birthDate: '',
      });      setBirthDay('');
      setBirthMonth('');
      setBirthYear('');      setPlayerParentMode('none');
      setParentFormData({ email: '', username: '', password: '', fullName: '', phoneNumber: '' });
    } else {
      alert(result.error || 'Failed to create user');
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] p-0 overflow-hidden rounded-3xl border-2 border-[#DDDDDD] bg-white shadow-2xl dark:border-[#000000] dark:bg-[#0a0a0a]">
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              key="create-user-dialog"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.35, type: 'spring', stiffness: 260, damping: 22 }}
              className="relative"
            >
              {/* Glow stays inside the dialog card */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-linear-to-br from-[#FF5F02]/25 via-purple-500/10 to-transparent blur-3xl"
                  animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.85, 0.6] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-linear-to-tr from-blue-500/15 via-[#FF5F02]/10 to-transparent blur-3xl"
                  animate={{ scale: [1, 1.04, 1], opacity: [0.55, 0.75, 0.55] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>

              <form onSubmit={handleSubmit} className="relative">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-black/10 dark:border-white/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="h-12 w-12 rounded-2xl border-2 border-[#DDDDDD] bg-white/70 backdrop-blur-sm flex items-center justify-center shadow-sm dark:border-[#000000] dark:bg-white/5"
                        whileHover={{ rotate: -2, scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                      >
                        <UserPlus className="h-6 w-6 text-[#262626] dark:text-white" />
                      </motion.div>
                      <div>
                        <DialogTitle className="text-xl font-black tracking-tight text-[#262626] dark:text-white">
                          {fixedRole === ROLES.PLAYER 
                            ? (locale === 'ar' ? 'إضافة لاعب' : 'Add Player')
                            : fixedRole === ROLES.COACH
                            ? (locale === 'ar' ? 'إضافة مدرب' : 'Add Coach')
                            : dictionary.users.createUser}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                          {dictionary.users.userDetails}
                        </DialogDescription>
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                  <div className="grid gap-6">
                    {(academies.length > 0 || academyId) && (
                      <div className="grid gap-2">
                        <Label htmlFor="academy" className="text-sm font-semibold text-[#262626] dark:text-white">
                          {dictionary.users.academy}
                        </Label>
                        {currentUserRole === ROLES.ADMIN ? (
                          <Select value={academyId} onValueChange={setAcademyId}>
                            <SelectTrigger className="h-12 rounded-xl border-2 border-[#DDDDDD] bg-white/80 dark:border-[#000000] dark:bg-white/5">
                              <SelectValue placeholder={dictionary.users.selectAcademy} />
                            </SelectTrigger>
                            <SelectContent>
                              {academies.map((academy) => (
                                <SelectItem key={academy.id} value={academy.id}>
                                  {locale === 'ar' ? academy.nameAr : academy.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id="academy"
                            value={
                              academies.find((a) => a.id === academyId)
                                ? locale === 'ar'
                                  ? academies.find((a) => a.id === academyId)!.nameAr
                                  : academies.find((a) => a.id === academyId)!.name
                                : academyId
                            }
                            disabled
                            className="h-12 rounded-xl border-2 border-[#DDDDDD] bg-white/60 dark:border-[#000000] dark:bg-white/5"
                          />
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-[#262626] dark:text-white">
                          {dictionary.common.email}
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="h-12 rounded-xl border-2 border-[#DDDDDD] bg-white/80 dark:border-[#000000] dark:bg-white/5"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="username" className="text-sm font-semibold text-[#262626] dark:text-white">
                          {dictionary.common.username}
                        </Label>
                        <Input
                          id="username"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          required
                          className="h-12 rounded-xl border-2 border-[#DDDDDD] bg-white/80 dark:border-[#000000] dark:bg-white/5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="password" className="text-sm font-semibold text-[#262626] dark:text-white">
                          {dictionary.common.password}
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                          className="h-12 rounded-xl border-2 border-[#DDDDDD] bg-white/80 dark:border-[#000000] dark:bg-white/5"
                        />
                      </div>

                      {!fixedRole && (
                        <div className="grid gap-2">
                          <Label htmlFor="role" className="text-sm font-semibold text-[#262626] dark:text-white">
                            {dictionary.users.role}
                          </Label>
                          <Select
                            value={formData.role}
                            onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                          >
                            <SelectTrigger className="h-12 rounded-xl border-2 border-[#DDDDDD] bg-white/80 dark:border-[#000000] dark:bg-white/5">
                              <SelectValue placeholder={dictionary.users.role} />
                            </SelectTrigger>
                            <SelectContent>
                              {(currentUserRole === ROLES.MANAGER
                                ? [
                                    ['PARENT', ROLES.PARENT] as const,
                                    ['PLAYER', ROLES.PLAYER] as const,
                                  ]
                                : (Object.entries(ROLES) as Array<[string, UserRole]>)
                              ).map(([key, value]) => (
                                <SelectItem key={value} value={value}>
                                  {key}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="fullName" className="text-sm font-semibold text-[#262626] dark:text-white">
                          {dictionary.common.fullName}
                        </Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="h-12 rounded-xl border-2 border-[#DDDDDD] bg-white/80 dark:border-[#000000] dark:bg-white/5"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="phoneNumber" className="text-sm font-semibold text-[#262626] dark:text-white">
                          {dictionary.common.phoneNumber}
                        </Label>
                        <Input
                          id="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          className="h-12 rounded-xl border-2 border-[#DDDDDD] bg-white/80 dark:border-[#000000] dark:bg-white/5"
                        />
                      </div>
                    </div>

                    {formData.role === ROLES.PLAYER && (
                      <div className="rounded-2xl border border-black/10 bg-white/60 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-2 text-sm font-bold text-[#262626] dark:text-white mb-4">
                          <GraduationCap className="h-4 w-4" />
                          {dictionary.dashboard?.academyAdmin?.playerRegistration ?? 'Player registration'}
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <div className="grid gap-2">
                            <Label className="text-sm font-semibold text-[#262626] dark:text-white">
                              {dictionary.dashboard?.academyAdmin?.birthDate ?? 'Birth date'}
                            </Label>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <Select value={birthDay} onValueChange={setBirthDay} required>
                                  <SelectTrigger className="h-12 rounded-xl border-2 border-[#DDDDDD] bg-white/80 dark:border-[#000000] dark:bg-white/5 font-medium">
                                    <SelectValue placeholder={locale === 'ar' ? 'يوم' : 'Day'} />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-[300px]">
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                      <SelectItem key={day} value={String(day)}>
                                        {day}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Select value={birthMonth} onValueChange={setBirthMonth} required>
                                  <SelectTrigger className="h-12 rounded-xl border-2 border-[#DDDDDD] bg-white/80 dark:border-[#000000] dark:bg-white/5 font-medium">
                                    <SelectValue placeholder={locale === 'ar' ? 'شهر' : 'Month'} />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-[300px]">
                                    <SelectItem value="1">{locale === 'ar' ? 'يناير' : 'January'}</SelectItem>
                                    <SelectItem value="2">{locale === 'ar' ? 'فبراير' : 'February'}</SelectItem>
                                    <SelectItem value="3">{locale === 'ar' ? 'مارس' : 'March'}</SelectItem>
                                    <SelectItem value="4">{locale === 'ar' ? 'أبريل' : 'April'}</SelectItem>
                                    <SelectItem value="5">{locale === 'ar' ? 'مايو' : 'May'}</SelectItem>
                                    <SelectItem value="6">{locale === 'ar' ? 'يونيو' : 'June'}</SelectItem>
                                    <SelectItem value="7">{locale === 'ar' ? 'يوليو' : 'July'}</SelectItem>
                                    <SelectItem value="8">{locale === 'ar' ? 'أغسطس' : 'August'}</SelectItem>
                                    <SelectItem value="9">{locale === 'ar' ? 'سبتمبر' : 'September'}</SelectItem>
                                    <SelectItem value="10">{locale === 'ar' ? 'أكتوبر' : 'October'}</SelectItem>
                                    <SelectItem value="11">{locale === 'ar' ? 'نوفمبر' : 'November'}</SelectItem>
                                    <SelectItem value="12">{locale === 'ar' ? 'ديسمبر' : 'December'}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Select value={birthYear} onValueChange={setBirthYear} required>
                                  <SelectTrigger className="h-12 rounded-xl border-2 border-[#DDDDDD] bg-white/80 dark:border-[#000000] dark:bg-white/5 font-medium">
                                    <SelectValue placeholder={locale === 'ar' ? 'سنة' : 'Year'} />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-[300px]">
                                    {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i - 3).map((year) => (
                                      <SelectItem key={year} value={String(year)}>
                                        {year}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                        </div>

                        <div className="mt-4 grid gap-3">
                          <div className="grid gap-2">
                            <Label className="text-sm font-semibold text-[#262626] dark:text-white">
                              {dictionary.dashboard?.academyAdmin?.parentLinking ?? 'Parent linking'}
                            </Label>
                            <Select value={playerParentMode} onValueChange={(v) => setPlayerParentMode(v as any)}>
                              <SelectTrigger className="h-12 rounded-xl border-2 border-[#DDDDDD] bg-white/80 dark:border-[#000000] dark:bg-white/5">
                                <SelectValue placeholder={dictionary.dashboard?.academyAdmin?.parentLinkingPlaceholder ?? 'Select'} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">{dictionary.dashboard?.academyAdmin?.parentNone ?? 'No parent now'}</SelectItem>
                                {parents.length > 0 && (
                                  <SelectItem value="existing">{dictionary.dashboard?.academyAdmin?.parentExisting ?? 'Link existing parent'}</SelectItem>
                                )}
                                <SelectItem value="create">{dictionary.dashboard?.academyAdmin?.parentCreate ?? 'Create parent now'}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {playerParentMode === 'existing' && parents.length > 0 && (
                            <div className="grid gap-2">
                              <Label htmlFor="parentId" className="text-sm font-semibold text-[#262626] dark:text-white">
                                {dictionary.users.parent}
                              </Label>
                              <Select value={formData.parentId} onValueChange={(value) => setFormData({ ...formData, parentId: value })}>
                                <SelectTrigger className="h-12 rounded-xl border-2 border-[#DDDDDD] bg-white/80 dark:border-[#000000] dark:bg-white/5">
                                  <SelectValue placeholder={dictionary.users.selectParent} />
                                </SelectTrigger>
                                <SelectContent>
                                  {parents.map((parent) => (
                                    <SelectItem key={parent.id} value={parent.id}>
                                      {parent.fullName} ({parent.email})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {playerParentMode === 'create' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label className="text-sm font-semibold text-[#262626] dark:text-white">{dictionary.common.email}</Label>
                                <Input
                                  type="email"
                                  value={parentFormData.email}
                                  onChange={(e) => setParentFormData({ ...parentFormData, email: e.target.value })}
                                  required
                                  className="h-12 rounded-xl border-2 border-[#DDDDDD] bg-white/80 dark:border-[#000000] dark:bg-white/5"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label className="text-sm font-semibold text-[#262626] dark:text-white">{dictionary.common.username}</Label>
                                <Input
                                  value={parentFormData.username}
                                  onChange={(e) => setParentFormData({ ...parentFormData, username: e.target.value })}
                                  required
                                  className="h-12 rounded-xl border-2 border-[#DDDDDD] bg-white/80 dark:border-[#000000] dark:bg-white/5"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label className="text-sm font-semibold text-[#262626] dark:text-white">{dictionary.common.password}</Label>
                                <Input
                                  type="password"
                                  value={parentFormData.password}
                                  onChange={(e) => setParentFormData({ ...parentFormData, password: e.target.value })}
                                  required
                                  className="h-12 rounded-xl border-2 border-[#DDDDDD] bg-white/80 dark:border-[#000000] dark:bg-white/5"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label className="text-sm font-semibold text-[#262626] dark:text-white">{dictionary.common.fullName}</Label>
                                <Input
                                  value={parentFormData.fullName}
                                  onChange={(e) => setParentFormData({ ...parentFormData, fullName: e.target.value })}
                                  className="h-12 rounded-xl border-2 border-[#DDDDDD] bg-white/80 dark:border-[#000000] dark:bg-white/5"
                                />
                              </div>
                              <div className="grid gap-2 sm:col-span-2">
                                <Label className="text-sm font-semibold text-[#262626] dark:text-white">{dictionary.common.phoneNumber}</Label>
                                <Input
                                  value={parentFormData.phoneNumber}
                                  onChange={(e) => setParentFormData({ ...parentFormData, phoneNumber: e.target.value })}
                                  className="h-12 rounded-xl border-2 border-[#DDDDDD] bg-white/80 dark:border-[#000000] dark:bg-white/5"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter className="px-6 py-5 border-t border-black/10 dark:border-white/10">
                  <Button asChild type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="rounded-xl">
                      {dictionary.common.cancel}
                    </motion.button>
                  </Button>
                  <Button asChild type="submit" disabled={isSubmitting} className="rounded-xl bg-[#262626] text-white hover:bg-black dark:bg-white dark:text-[#262626] dark:hover:bg-gray-100">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      {isSubmitting ? dictionary.common.loading : dictionary.common.create}
                    </motion.button>
                  </Button>
                </DialogFooter>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
