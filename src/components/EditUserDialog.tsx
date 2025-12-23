'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCog, Shield, GraduationCap } from 'lucide-react';
import type { User } from '@/lib/db/repositories/userRepository';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { UserRole, ROLES, ROLE_LABELS } from '@/config/roles';
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
import { Checkbox } from '@/components/ui/checkbox';
import { updateUserAction } from '@/lib/actions/userActions';
import { getAcademyUiContextAction, getUserPrimaryAcademyIdAction } from '@/lib/actions/academyActions';
import type { Academy } from '@/lib/db/repositories/academyRepository';

export interface EditUserDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dictionary: Dictionary;
  onUserUpdated: (user: User) => void;
  locale: string;
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  dictionary,
  onUserUpdated,
  locale,
}: EditUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [academyId, setAcademyId] = useState<string>('');
  const [formData, setFormData] = useState({
    email: user.email,
    username: user.username,
    password: '',
    fullName: user.fullName || '',
    phoneNumber: user.phoneNumber || '',
    role: user.role,
    isActive: user.isActive,
    birthDate: user.birthDate || '',
    ageCategory: user.ageCategory || '',
  });

  useEffect(() => {
    if (open) {
      loadAcademyContext();
    }
  }, [open]);

  const loadAcademyContext = async () => {
    const ctxResult = await getAcademyUiContextAction(locale);
    if (ctxResult.success) {
      setAcademies(ctxResult.academies);
      setCurrentUserRole(ctxResult.userRole as UserRole);
      setAcademyId(ctxResult.currentAcademyId);
    }

    const userAcademyResult = await getUserPrimaryAcademyIdAction({ locale, userId: user.id });
    if (userAcademyResult.success && userAcademyResult.academyId) {
      setAcademyId(userAcademyResult.academyId);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const canPickAcademy = currentUserRole === ROLES.ADMIN;

    const updateData: any = {
      email: formData.email,
      username: formData.username,
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      role: formData.role,
      isActive: formData.isActive,
      birthDate: formData.role === ROLES.KID ? formData.birthDate : undefined,
      ageCategory: formData.role === ROLES.KID ? formData.ageCategory : undefined,
    };

    if (formData.password) {
      updateData.password = formData.password;
    }

    const result = await updateUserAction(user.id, updateData, {
      locale,
      academyId: canPickAcademy ? academyId : undefined,
    });

    if (result.success && result.user) {
      onUserUpdated(result.user);
      onOpenChange(false);
    } else {
      alert(result.error || 'Failed to update user');
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] p-0 overflow-hidden rounded-3xl border-2 border-[#DDDDDD] bg-white shadow-2xl dark:border-[#000000] dark:bg-[#0a0a0a]">
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              key="edit-user-dialog"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.35, type: 'spring', stiffness: 260, damping: 22 }}
              className="relative"
            >
              {/* Glow stays inside the dialog card */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-linear-to-br from-purple-500/15 via-[#FF5F02]/15 to-transparent blur-3xl"
                  animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.85, 0.6] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-linear-to-tr from-blue-500/15 via-[#FF5F02]/10 to-transparent blur-3xl"
                  animate={{ scale: [1, 1.04, 1], opacity: [0.55, 0.75, 0.55] }}
                  transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>

              <form onSubmit={handleSubmit} className="relative">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-black/10 dark:border-white/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="h-12 w-12 rounded-2xl border-2 border-[#DDDDDD] bg-white/70 backdrop-blur-sm flex items-center justify-center shadow-sm dark:border-[#000000] dark:bg-white/5"
                        whileHover={{ rotate: 2, scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                      >
                        <UserCog className="h-6 w-6 text-[#262626] dark:text-white" />
                      </motion.div>
                      <div>
                        <DialogTitle className="text-xl font-black tracking-tight text-[#262626] dark:text-white">
                          {dictionary.users.editUser}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                          {dictionary.users.userDetails}
                        </DialogDescription>
                      </div>
                    </div>

                    <motion.div
                      className="hidden sm:flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#262626] backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Shield className="h-4 w-4" />
                      {dictionary.users.active}
                    </motion.div>
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
                          placeholder={dictionary.users.keepPasswordPlaceholder}
                          className="h-12 rounded-xl border-2 border-[#DDDDDD] bg-white/80 dark:border-[#000000] dark:bg-white/5"
                        />
                      </div>

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
                                  ['COACH', ROLES.COACH] as const,
                                  ['PARENT', ROLES.PARENT] as const,
                                  ['KID', ROLES.KID] as const,
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
                    </div>

                    {/* Kid required fields (age + age category) */}
                    {formData.role === ROLES.KID && (
                      <div className="rounded-2xl border border-black/10 bg-white/60 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-2 text-sm font-bold text-[#262626] dark:text-white mb-4">
                          <GraduationCap className="h-4 w-4" />
                          {dictionary.dashboard?.academyAdmin?.playerRegistration ?? 'Player registration'}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="birthDate" className="text-sm font-semibold text-[#262626] dark:text-white">
                              {dictionary.dashboard?.academyAdmin?.birthDate ?? 'Birth date'}
                            </Label>
                            <Input
                              id="birthDate"
                              type="date"
                              value={formData.birthDate}
                              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                              required
                              className="h-12 rounded-xl border-2 border-[#DDDDDD] bg-white/80 dark:border-[#000000] dark:bg-white/5"
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="ageCategory" className="text-sm font-semibold text-[#262626] dark:text-white">
                              {dictionary.dashboard?.academyAdmin?.ageCategory ?? 'Age category'}
                            </Label>
                            <Input
                              id="ageCategory"
                              value={formData.ageCategory}
                              onChange={(e) => setFormData({ ...formData, ageCategory: e.target.value })}
                              placeholder={dictionary.dashboard?.academyAdmin?.ageCategoryPlaceholder ?? 'e.g. U10'}
                              required
                              className="h-12 rounded-xl border-2 border-[#DDDDDD] bg-white/80 dark:border-[#000000] dark:bg-white/5"
                            />
                          </div>
                        </div>
                      </div>
                    )}

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

                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white/60 px-4 py-3 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                      <div>
                        <Label htmlFor="isActive" className="text-sm font-semibold text-[#262626] dark:text-white">
                          {dictionary.users.active}
                        </Label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {dictionary.users.status}
                        </p>
                      </div>
                      <Checkbox
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked === true })}
                      />
                    </div>
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
                      {isSubmitting ? dictionary.common.loading : dictionary.common.save}
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
