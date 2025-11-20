'use client';

import { useState } from 'react';
import { User, Mail, Phone, UserCircle, Save, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { User as UserType } from '@/lib/db/repositories/userRepository';
import { ImageUpload } from '@/components/ImageUpload';
import { updateUserAction } from '@/lib/actions/userActions';
import { useConfirm } from '@/components/ConfirmDialog';

interface ProfileClientProps {
  dictionary: Dictionary;
  locale: Locale;
  user: UserType;
}

export function ProfileClient({ dictionary, locale, user }: ProfileClientProps) {
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    phoneNumber: user.phoneNumber || '',
    email: user.email || '',
  });
  const [profilePicture, setProfilePicture] = useState(user.profilePicture || '');
  const [loading, setLoading] = useState(false);
  const { confirm, ConfirmDialog } = useConfirm();

  const handleImageUpload = async (file: File, croppedImageUrl: string) => {
    try {
      const formData = new FormData();
      
      // Convert cropped image URL to Blob
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      formData.append('file', blob, file.name);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.ok) {
        const data = await uploadResponse.json();
        setProfilePicture(data.url);
      }
    } catch (error) {
      console.error('Upload error:', error);
      await confirm({
        title: dictionary.common.error || 'Error',
        description: 'Failed to upload image. Please try again.',
        confirmText: 'OK',
        variant: 'destructive',
      });
    }
  };

  const handleImageError = async (message: string) => {
    await confirm({
      title: dictionary.common.error || 'Error',
      description: message,
      confirmText: 'OK',
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

    const result = await updateUserAction(user.id, {
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      profilePicture: profilePicture,
    });

    setLoading(false);

    if (result.success) {
      await confirm({
        title: dictionary.common.success || 'Success',
        description: dictionary.users?.profileUpdated || 'Profile updated successfully!',
        confirmText: 'OK',
      });
      window.location.reload();
    } else {
      await confirm({
        title: dictionary.common.error || 'Error',
        description: result.error || 'Failed to update profile',
        confirmText: 'OK',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-[#1E3A8A]">
            {dictionary.users?.profile || 'My Profile'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {dictionary.users?.profileDescription || 'Manage your account information and profile picture'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Section */}
          <Card className="border-2 border-[#30B2D2]/30">
            <CardHeader className="bg-gradient-to-r from-[#30B2D2]/10 to-[#1E3A8A]/10">
              <CardTitle className="text-xl font-bold text-[#1E3A8A] flex items-center gap-2">
                <Camera className="h-6 w-6" />
                {dictionary.users?.profilePicture || 'Profile Picture'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ImageUpload
                onUpload={handleImageUpload}
                currentImage={profilePicture}
                aspectRatio={1}
                maxSizeMB={5}
                onError={handleImageError}
              />
            </CardContent></invoke>
          </Card>

          {/* Personal Information */}
          <Card className="border-2 border-[#30B2D2]/30">
            <CardHeader className="bg-gradient-to-r from-[#30B2D2]/10 to-[#1E3A8A]/10">
              <CardTitle className="text-xl font-bold text-[#1E3A8A] flex items-center gap-2">
                <UserCircle className="h-6 w-6" />
                {dictionary.users?.personalInfo || 'Personal Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#30B2D2]" />
                    {dictionary.common.fullName}
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder={dictionary.common.fullName}
                    className="border-gray-300 focus:border-[#30B2D2]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#30B2D2]" />
                    {dictionary.common.email}
                  </Label>
                  <Input
                    id="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-100 border-gray-300"
                  />
                  <p className="text-xs text-muted-foreground">
                    {dictionary.users?.emailNote || 'Email cannot be changed'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#30B2D2]" />
                    {dictionary.common.phoneNumber}
                  </Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    placeholder={dictionary.common.phoneNumber}
                    className="border-gray-300 focus:border-[#30B2D2]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4 text-[#30B2D2]" />
                    {dictionary.common.username}
                  </Label>
                  <Input
                    id="username"
                    value={user.username}
                    disabled
                    className="bg-gray-100 border-gray-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#30B2D2] to-[#1E3A8A] hover:from-[#1E3A8A] hover:to-[#30B2D2] text-white px-8 py-6 text-lg"
            >
              <Save className="mr-2 h-5 w-5" />
              {loading ? dictionary.common.loading : dictionary.common.save}
            </Button>
          </div>
        </form>
      </div>

      <ConfirmDialog />
    </>
  );
}
