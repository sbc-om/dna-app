'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, UserCircle, Save, Camera, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { ImageUpload } from '@/components/ImageUpload';
import { updateOwnProfileAction } from '@/lib/actions/userActions';
import { useConfirm } from '@/components/ConfirmDialog';

interface ProfileClientProps {
  dictionary: Dictionary;
  locale: Locale;
  user: {
    id: string;
    email: string;
    username: string;
    fullName?: string;
    phoneNumber?: string;
    profilePicture?: string;
    role: string;
  };
}

export function ProfileClient({ dictionary, locale, user }: ProfileClientProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    phoneNumber: user.phoneNumber || '',
    email: user.email || '',
  });
  const [profilePicture, setProfilePicture] = useState(user.profilePicture || '');
  const [loading, setLoading] = useState(false);
  const { confirm, ConfirmDialog } = useConfirm();

  const displayName = formData.fullName?.trim() || user.username;
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'U';

  const handleImageUpload = async (file: File, croppedImageUrl: string) => {
    try {
      const uploadFormData = new FormData();
      
      // Convert cropped image URL to Blob
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      uploadFormData.append('file', blob, file.name);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (uploadResponse.ok) {
        const data = await uploadResponse.json();
        const newImageUrl = data.url;
        
        // Update local state immediately for instant preview
        setProfilePicture(newImageUrl);
        
        // Save immediately to database
        const result = await updateOwnProfileAction({
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          profilePicture: newImageUrl,
        });
        
        if (result.success) {
          // Show success message
          await confirm({
            title: dictionary.common.success || 'Success',
            description: dictionary.users?.profilePictureUpdated || 'Profile picture updated successfully!',
            confirmText: dictionary.common.continue || 'Continue',
          });
          
          // Refresh to update header and all components
          router.refresh();
        } else {
          await confirm({
            title: dictionary.common.error || 'Error',
            description: result.error || 'Failed to save profile picture',
            confirmText: dictionary.common.continue || 'Continue',
            variant: 'destructive',
          });
          // Revert to old image on error
          setProfilePicture(user.profilePicture || '');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      await confirm({
        title: dictionary.common.error || 'Error',
        description: dictionary.common.error || 'Error',
        confirmText: dictionary.common.continue || 'Continue',
        variant: 'destructive',
      });
    }
  };

  const handleImageError = async (message: string) => {
    await confirm({
      title: dictionary.common.error || 'Error',
      description: message,
      confirmText: dictionary.common.continue || 'Continue',
      variant: 'destructive',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const confirmed = await confirm({
      title: dictionary.users?.updateProfile || 'Update Profile',
      description: dictionary.users?.confirmUpdate || 'Are you sure you want to update your profile?',
      confirmText: dictionary.common.save,
      cancelText: dictionary.common.cancel,
    });

    if (!confirmed) return;

    setLoading(true);

    const result = await updateOwnProfileAction({
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      profilePicture: profilePicture,
    });

    setLoading(false);

    if (result.success) {
      await confirm({
        title: dictionary.common.success || 'Success',
        description: dictionary.users?.profileUpdated || 'Profile updated successfully!',
        confirmText: dictionary.common.continue || 'Continue',
      });
      router.refresh();
    } else {
      await confirm({
        title: dictionary.common.error || 'Error',
        description: result.error || 'Failed to update profile',
        confirmText: dictionary.common.continue || 'Continue',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="space-y-6"
      >
        {/* Game-like Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-slate-950 via-indigo-950 to-purple-950 p-6 sm:p-8 shadow-2xl"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -left-24 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <motion.div
              className="absolute left-10 top-10 h-2 w-2 rounded-full bg-white/40"
              animate={{ y: [0, -10, 0], opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute right-14 bottom-14 h-1.5 w-1.5 rounded-full bg-white/30"
              animate={{ y: [0, 12, 0], opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-5">
              <motion.div
                whileHover={{ rotateY: 6, rotateX: 6, scale: 1.03 }}
                style={{ transformStyle: 'preserve-3d' }}
                className="relative"
              >
                <div className="h-16 w-16 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-xl ring-1 ring-white/15 shadow-lg flex items-center justify-center">
                  {profilePicture ? (
                    <img src={profilePicture} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-white font-extrabold">{initials}</span>
                  )}
                </div>
                <motion.div
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-2xl bg-orange-500/20 border border-orange-500/20 backdrop-blur-xl flex items-center justify-center"
                  animate={{ rotate: [0, -6, 6, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <UserCircle className="h-4 w-4 text-orange-200" />
                </motion.div>
              </motion.div>

              <div className="min-w-0">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-1 truncate">
                  {dictionary.users?.profile || 'Profile'}
                </h1>
                <p className="text-white/80 font-semibold truncate">{displayName}</p>
                <p className="text-white/65 text-sm truncate">@{user.username}</p>
                <p className="text-white/65 text-sm truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  type="submit"
                  form="profile-form"
                  disabled={loading}
                  className="h-11 px-5 bg-white text-slate-950 hover:bg-white/90 border border-white/20 font-bold shadow-lg"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? (dictionary.common.loading || 'Loading...') : dictionary.common.save}
                </Button>
              </motion.div>

              <div className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl px-4 py-2 shadow-lg">
                <div className="flex items-center gap-2 text-xs text-white/80">
                  <Shield className="h-4 w-4 text-emerald-200" />
                  <span className="font-semibold">{dictionary.users?.role || 'Role'}:</span>
                  <span className="font-extrabold text-white">{user.role}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: Mail, label: dictionary.common.email, value: user.email },
              { icon: UserCircle, label: dictionary.common.username, value: user.username },
              { icon: Shield, label: dictionary.users?.role || 'Role', value: user.role },
              { icon: User, label: dictionary.users?.userId || 'User ID', value: user.id },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + index * 0.06 }}
                whileHover={{ y: -3, scale: 1.01 }}
                className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl p-4 shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <motion.div
                    animate={{ rotate: [0, -4, 4, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    className="h-11 w-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center"
                  >
                    <item.icon className="h-5 w-5 text-white/80" />
                  </motion.div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white/70">{item.label}</p>
                    <p className="text-sm font-extrabold text-white truncate">{item.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Avatar */}
            <div className="lg:col-span-4 space-y-6">
              <motion.div
                whileHover={{ scale: 1.01, rotateY: 5, rotateX: 5 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-2xl">
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity" />
                  <CardHeader className="border-b border-white/10">
                    <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <UserCircle className="h-5 w-5 text-orange-500" />
                      {dictionary.users?.profile || 'Profile'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl overflow-hidden border border-white/10 bg-slate-950/60 flex items-center justify-center shrink-0">
                        {profilePicture ? (
                          <img src={profilePicture} alt={displayName} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-white font-extrabold text-sm">{initials}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-extrabold text-slate-900 dark:text-white truncate">{displayName}</p>
                        <p className="text-xs text-slate-600 dark:text-white/60 truncate">{user.email}</p>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-white/45 truncate">@{user.username}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/50 dark:bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-white/70">
                        <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                        <span className="font-semibold">{dictionary.users?.role || 'Role'}:</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">{user.role}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.01, rotateY: 5, rotateX: 5 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <Card className="overflow-hidden rounded-3xl border border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-2xl">
                  <CardHeader className="border-b border-white/10">
                    <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Camera className="h-5 w-5 text-orange-500" />
                      {dictionary.users?.profilePicture || 'Profile picture'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <ImageUpload
                      onUpload={handleImageUpload}
                      currentImage={profilePicture}
                      aspectRatio={1}
                      maxSizeMB={5}
                      onError={handleImageError}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right: Editable fields */}
            <div className="lg:col-span-8 space-y-6">
              <motion.div
                whileHover={{ scale: 1.01, rotateY: 4, rotateX: 4 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <Card className="overflow-hidden rounded-3xl border border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-2xl">
                  <CardHeader className="border-b border-white/10">
                    <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <User className="h-5 w-5 text-orange-500" />
                      {dictionary.users?.personalInfo || 'Personal information'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-sm font-semibold text-slate-900 dark:text-white">
                          {dictionary.common.fullName}
                        </Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder={dictionary.common.fullName}
                          className="h-11 border border-white/10 bg-white/60 dark:bg-white/5"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber" className="text-sm font-semibold text-slate-900 dark:text-white">
                          {dictionary.common.phoneNumber}
                        </Label>
                        <Input
                          id="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          placeholder={dictionary.common.phoneNumber}
                          className="h-11 border border-white/10 bg-white/60 dark:bg-white/5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-600 dark:text-white/70" />
                          {dictionary.common.email}
                        </Label>
                        <Input
                          id="email"
                          value={formData.email}
                          disabled
                          className="h-11 border border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/80"
                        />
                        <p className="text-xs text-slate-600 dark:text-white/60">
                          {dictionary.users?.emailNote || 'Email cannot be changed'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <UserCircle className="h-4 w-4 text-slate-600 dark:text-white/70" />
                          {dictionary.common.username}
                        </Label>
                        <Input
                          id="username"
                          value={user.username}
                          disabled
                          className="h-11 border border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/80"
                        />
                        <p className="text-xs text-slate-600 dark:text-white/60">&nbsp;</p>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/50 dark:bg-white/5 p-5">
                      <div className="flex items-start gap-3">
                        <motion.div
                          animate={{ rotate: [0, -6, 6, 0] }}
                          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                          className="h-10 w-10 rounded-2xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-center"
                        >
                          <Phone className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                        </motion.div>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {dictionary.users?.contactInfo || 'Contact info'}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-white/60">
                            {dictionary.users?.contactInfoHint || 'Keep your phone number up to date so you can receive important notifications.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="mr-auto text-sm font-semibold text-slate-600 dark:text-white/70"
                    >
                      {dictionary.common.loading}
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 px-6 bg-slate-950 hover:bg-slate-900 text-white border border-white/10 shadow-lg"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {dictionary.common.save}
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </form>
      </motion.div>

      <ConfirmDialog />
    </>
  );
}
