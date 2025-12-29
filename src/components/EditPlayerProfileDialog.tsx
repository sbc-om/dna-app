'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User } from '@/lib/db/repositories/userRepository';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { updateUserAction } from '@/lib/actions/userActions';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, UserCog } from 'lucide-react';

interface EditKidProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kid: User;
  dictionary: Dictionary;
  onProfileUpdated: (updatedKid: User) => void;
}

export function EditKidProfileDialog({
  open,
  onOpenChange,
  kid,
  dictionary,
  onProfileUpdated,
}: EditKidProfileDialogProps) {
  const inputClass =
    'h-12 bg-white dark:bg-[#111114] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500';
  const selectTriggerClass =
    'h-12 w-full bg-white dark:bg-[#111114] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white';
  const selectContentClass =
    'bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] rounded-xl';

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: kid.fullName || '',
    nationalId: kid.nationalId || '',
    birthDate: kid.birthDate || '',
    gender: kid.gender || '',
    phoneNumber: kid.phoneNumber || '',
    address: kid.address || '',
    school: kid.school || '',
    grade: kid.grade || '',
    medicalInfo: kid.medicalInfo || '',
    position: kid.position || '',
    preferredFoot: kid.preferredFoot || '',
    height: kid.height || '',
    weight: kid.weight || '',
    country: kid.country || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const updates: any = {
      fullName: formData.fullName,
      nationalId: formData.nationalId,
      birthDate: formData.birthDate,
      gender: formData.gender as 'male' | 'female' | undefined,
      phoneNumber: formData.phoneNumber,
      address: formData.address,
      school: formData.school,
      grade: formData.grade,
      medicalInfo: formData.medicalInfo,
      position: formData.position,
      preferredFoot: formData.preferredFoot as 'left' | 'right' | 'both' | undefined,
      height: formData.height ? parseInt(formData.height.toString()) : undefined,
      weight: formData.weight ? parseInt(formData.weight.toString()) : undefined,
      country: formData.country,
    };

    const result = await updateUserAction(kid.id, updates);
    setLoading(false);

    if (result.success && result.user) {
      onProfileUpdated(result.user);
      onOpenChange(false);
    } else {
      alert(result.error || 'Failed to update profile');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[980px] p-0 overflow-hidden rounded-3xl border-2 border-[#DDDDDD] bg-white shadow-2xl dark:border-[#000000] dark:bg-[#0a0a0a]">
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              key="edit-kid-profile-dialog"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.35, type: 'spring', stiffness: 260, damping: 22 }}
              className="relative"
            >
              {/* Glow stays inside the dialog card */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-linear-to-br from-purple-500/15 via-[#FF5F02]/10 to-transparent blur-3xl"
                  animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.85, 0.6] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-linear-to-tr from-blue-500/15 via-[#FF5F02]/10 to-transparent blur-3xl"
                  animate={{ scale: [1, 1.04, 1], opacity: [0.55, 0.75, 0.55] }}
                  transition={{ duration: 5.1, repeat: Infinity, ease: 'easeInOut' }}
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
                        aria-hidden
                      >
                        <UserCog className="h-6 w-6 text-[#262626] dark:text-white" />
                      </motion.div>
                      <div>
                        <DialogTitle className="text-xl font-black tracking-tight text-[#262626] dark:text-white">
                          {dictionary.users.editUser}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                          Update the kid profile information
                        </DialogDescription>
                      </div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="hidden sm:flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#262626] backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Profile editor</span>
                    </motion.div>
                  </div>
                </DialogHeader>

                <div className="px-6 py-6 max-h-[75vh] overflow-y-auto">
                  <div className="grid gap-6">
                    {/* Basic Info */}
                    <div className="rounded-2xl border border-black/10 bg-white/60 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                      <div className="text-sm font-black text-[#262626] dark:text-white mb-4">
                        Basic information
                      </div>
            
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName" className="text-sm font-semibold text-[#262626] dark:text-white">
                            {dictionary.users.name}
                          </Label>
                          <Input
                            id="fullName"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            required
                            className={inputClass}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="nationalId" className="text-sm font-semibold text-[#262626] dark:text-white">
                            {dictionary.users.nationalId}
                          </Label>
                          <Input
                            id="nationalId"
                            value={formData.nationalId}
                            onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="birthDate" className="text-sm font-semibold text-[#262626] dark:text-white">
                            Birth date
                          </Label>
                          <Input
                            id="birthDate"
                            type="date"
                            value={formData.birthDate}
                            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="gender" className="text-sm font-semibold text-[#262626] dark:text-white">
                            Gender
                          </Label>
                          <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                            <SelectTrigger className={selectTriggerClass}>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent className={selectContentClass}>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber" className="text-sm font-semibold text-[#262626] dark:text-white">
                            {dictionary.common.phoneNumber}
                          </Label>
                          <Input
                            id="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-sm font-semibold text-[#262626] dark:text-white">
                            Country
                          </Label>
                          <Input
                            id="country"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Education Info */}
                    <div className="rounded-2xl border border-black/10 bg-white/60 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                      <div className="text-sm font-black text-[#262626] dark:text-white mb-4">
                        Education & medical
                      </div>
            
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="school" className="text-sm font-semibold text-[#262626] dark:text-white">School</Label>
                          <Input
                            id="school"
                            value={formData.school}
                            onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="grade" className="text-sm font-semibold text-[#262626] dark:text-white">Grade</Label>
                          <Input
                            id="grade"
                            value={formData.grade}
                            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="address" className="text-sm font-semibold text-[#262626] dark:text-white">Address</Label>
                          <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="medicalInfo" className="text-sm font-semibold text-[#262626] dark:text-white">Medical information</Label>
                          <Input
                            id="medicalInfo"
                            value={formData.medicalInfo}
                            onChange={(e) => setFormData({ ...formData, medicalInfo: e.target.value })}
                            placeholder="Allergies, medications, medical conditions..."
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sports Info */}
                    <div className="rounded-2xl border border-black/10 bg-white/60 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                      <div className="text-sm font-black text-[#262626] dark:text-white mb-4">
                        Sports information
                      </div>
            
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="position" className="text-sm font-semibold text-[#262626] dark:text-white">Position</Label>
                          <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                            <SelectTrigger className={selectTriggerClass}>
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                            <SelectContent className={selectContentClass}>
                              <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                              <SelectItem value="Defender">Defender</SelectItem>
                              <SelectItem value="Midfielder">Midfielder</SelectItem>
                              <SelectItem value="Forward">Forward</SelectItem>
                              <SelectItem value="Winger">Winger</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="preferredFoot" className="text-sm font-semibold text-[#262626] dark:text-white">Preferred foot</Label>
                          <Select value={formData.preferredFoot} onValueChange={(value) => setFormData({ ...formData, preferredFoot: value })}>
                            <SelectTrigger className={selectTriggerClass}>
                              <SelectValue placeholder="Select foot" />
                            </SelectTrigger>
                            <SelectContent className={selectContentClass}>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                              <SelectItem value="both">Both</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label htmlFor="height" className="text-sm font-semibold text-[#262626] dark:text-white">Height (cm)</Label>
                            <div className="px-3 py-1 rounded-lg bg-blue-500 text-white font-bold text-sm">
                              {formData.height || '0'}
                            </div>
                          </div>
                          <input
                            id="height"
                            type="range"
                            min="50"
                            max="250"
                            step="1"
                            value={formData.height || '50'}
                            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                            className="slider w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            aria-label="Height in centimeters"
                            title="Height in centimeters"
                            style={{
                              background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((parseFloat(String(formData.height || '50')) - 50) / 200) * 100}%, rgb(229, 231, 235) ${((parseFloat(String(formData.height || '50')) - 50) / 200) * 100}%, rgb(229, 231, 235) 100%)`,
                            }}
                          />
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>50</span>
                            <span>150</span>
                            <span>250</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label htmlFor="weight" className="text-sm font-semibold text-[#262626] dark:text-white">Weight (kg)</Label>
                            <div className="px-3 py-1 rounded-lg bg-blue-500 text-white font-bold text-sm">
                              {formData.weight || '0'}
                            </div>
                          </div>
                          <input
                            id="weight"
                            type="range"
                            min="10"
                            max="150"
                            step="1"
                            value={formData.weight || '10'}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            className="slider w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            aria-label="Weight in kilograms"
                            title="Weight in kilograms"
                            style={{
                              background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((parseFloat(String(formData.weight || '10')) - 10) / 140) * 100}%, rgb(229, 231, 235) ${((parseFloat(String(formData.weight || '10')) - 10) / 140) * 100}%, rgb(229, 231, 235) 100%)`,
                            }}
                          />
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>10</span>
                            <span>80</span>
                            <span>150</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <DialogFooter className="px-6 py-5 border-t border-black/10 dark:border-white/10">
                  <Button asChild type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="h-12 rounded-xl border-2">
                      {dictionary.common.cancel}
                    </motion.button>
                  </Button>
                  <Button asChild type="submit" disabled={loading} className="rounded-xl bg-[#0b0b0f] text-white hover:bg-[#14141a]">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="h-12">
                      {loading ? dictionary.common.loading : dictionary.common.save}
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
