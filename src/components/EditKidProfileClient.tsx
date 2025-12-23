'use client';

import { useState } from 'react';
import { Save, User as UserIcon, Mail, Phone, IdCard, Sparkles, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import type { User } from '@/lib/db/repositories/userRepository';
import type { Academy } from '@/lib/db/repositories/academyRepository';
import { updateUserAction } from '@/lib/actions/userActions';
import { useRouter } from 'next/navigation';

interface EditKidProfileClientProps {
  dictionary: Dictionary;
  locale: Locale;
  kid: User;
  academies: Academy[];
  currentAcademyIds: string[];
  parents: User[];
}

export function EditKidProfileClient({
  dictionary,
  locale,
  kid,
  academies,
  currentAcademyIds,
  parents,
}: EditKidProfileClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: kid.fullName || '',
    email: kid.email || '',
    phoneNumber: kid.phoneNumber || '',
    nationalId: kid.nationalId || '',
    parentId: kid.parentId || '',
  });
  const [selectedAcademyId, setSelectedAcademyId] = useState<string>(currentAcademyIds[0] || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update user profile
      const result = await updateUserAction(kid.id, formData, {
        locale,
        academyId: selectedAcademyId || undefined,
      });

      if (!result.success) {
        alert(result.error || 'Failed to update profile');
        setLoading(false);
        return;
      }

      alert(dictionary.users?.profileUpdated || 'Profile updated successfully!');
      router.push(`/${locale}/dashboard/kids/${kid.id}`);
      router.refresh();
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${locale}/dashboard/kids/${kid.id}`);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black/5 dark:bg-white/5 rounded-xl">
                <Sparkles className="h-6 w-6 text-gray-700 dark:text-gray-200" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-[#262626] dark:text-white">
                  {dictionary.users?.editUser || 'Edit Profile'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {locale === 'ar' ? 'تحديث معلومات وتفاصيل الطفل' : 'Update kid information and details'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] overflow-hidden">
            <CardHeader className="bg-gray-50 dark:bg-[#1a1a1a] border-b-2 border-[#DDDDDD] dark:border-[#000000]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                  <UserIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-[#262626] dark:text-white">
                    {locale === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {locale === 'ar' ? 'قم بتحديث البيانات الشخصية للطفل' : 'Update the personal details of the kid'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label 
                  htmlFor="fullName" 
                  className="text-sm font-semibold text-[#262626] dark:text-white flex items-center gap-2"
                >
                  <UserIcon className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                  {dictionary.common?.fullName || 'Full Name'}
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder={locale === 'ar' ? 'أدخل الاسم الكامل' : 'Enter full name'}
                  className="bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-gray-400 dark:focus:border-gray-600 text-[#262626] dark:text-white h-12 text-base transition-colors"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label 
                  htmlFor="email" 
                  className="text-sm font-semibold text-[#262626] dark:text-white flex items-center gap-2"
                >
                  <Mail className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                  {dictionary.common?.email || 'Email'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={dictionary.auth?.emailPlaceholder || 'Enter email'}
                  className="bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-gray-400 dark:focus:border-gray-600 text-[#262626] dark:text-white h-12 text-base transition-colors"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label 
                  htmlFor="phoneNumber" 
                  className="text-sm font-semibold text-[#262626] dark:text-white flex items-center gap-2"
                >
                  <Phone className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                  {dictionary.common?.phoneNumber || 'Phone Number'}
                </Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder={locale === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number'}
                  className="bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-gray-400 dark:focus:border-gray-600 text-[#262626] dark:text-white h-12 text-base transition-colors"
                />
              </div>

              {/* National ID */}
              <div className="space-y-2">
                <Label 
                  htmlFor="nationalId" 
                  className="text-sm font-semibold text-[#262626] dark:text-white flex items-center gap-2"
                >
                  <IdCard className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                  {dictionary.users?.nationalId || 'National ID'}
                </Label>
                <Input
                  id="nationalId"
                  value={formData.nationalId}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  placeholder={dictionary.users?.nationalIdPlaceholder || 'Enter national ID'}
                  className="bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-gray-400 dark:focus:border-gray-600 text-[#262626] dark:text-white h-12 text-base transition-colors"
                />
              </div>

              {/* Parent Selection */}
              {parents.length > 0 && (
                <div className="space-y-2">
                  <Label 
                    htmlFor="parentId" 
                    className="text-sm font-semibold text-[#262626] dark:text-white flex items-center gap-2"
                  >
                    <UserIcon className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                    {dictionary.dashboard?.academyAdmin?.parentLinking || 'Parent'}
                  </Label>
                  <Select
                    value={formData.parentId || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, parentId: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger className="w-full h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white">
                      <SelectValue placeholder={dictionary.dashboard?.academyAdmin?.parentLinkingPlaceholder || 'Select'} />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
                      <SelectItem value="none" className="text-[#262626] dark:text-white cursor-pointer">
                        {dictionary.dashboard?.academyAdmin?.parentNone || 'No parent'}
                      </SelectItem>
                      {parents.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id} className="text-[#262626] dark:text-white cursor-pointer">
                          {parent.fullName || parent.username} ({parent.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {locale === 'ar'
                      ? 'حدد الوالد/الوصي المسؤول عن هذا الطفل'
                      : 'Select the parent/guardian responsible for this kid'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Academy Selection */}
          <Card className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] overflow-hidden">
            <CardHeader className="bg-gray-50 dark:bg-[#1a1a1a] border-b-2 border-[#DDDDDD] dark:border-[#000000]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                  <Building2 className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-[#262626] dark:text-white">
                    {locale === 'ar' ? 'الأكاديميات' : 'Academies'}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {locale === 'ar' ? 'حدد الأكاديمية التي ينتمي إليها هذا الطفل' : 'Select the academy this kid belongs to'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {academies.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                  {locale === 'ar' ? 'لا توجد أكاديميات متاحة' : 'No academies available'}
                </p>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[#262626] dark:text-white">
                    {locale === 'ar' ? 'الأكاديمية' : 'Academy'}
                  </Label>
                  <Select value={selectedAcademyId || 'none'} onValueChange={(v) => setSelectedAcademyId(v === 'none' ? '' : v)}>
                    <SelectTrigger className="w-full h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white">
                      <SelectValue placeholder={locale === 'ar' ? 'اختر أكاديمية' : 'Select an academy'} />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000]">
                      <SelectItem value="none" className="text-[#262626] dark:text-white cursor-pointer">
                        {locale === 'ar' ? 'بدون' : 'None'}
                      </SelectItem>
                      {academies.map((academy) => (
                        <SelectItem key={academy.id} value={academy.id} className="text-[#262626] dark:text-white cursor-pointer">
                          {locale === 'ar' ? academy.nameAr : academy.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {locale === 'ar'
                      ? 'سيتم تحديث عضوية الأكاديمية تلقائياً عند الحفظ'
                      : 'Academy membership will be updated automatically on save'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel} 
              disabled={loading}
              className="bg-white dark:bg-[#262626] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white h-12 px-8 font-semibold transition-colors"
            >
              {dictionary.common?.cancel || 'Cancel'}
            </Button>
            <Button
              type="submit"
              className="bg-[#262626] hover:bg-black text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black h-12 px-8 font-semibold transition-colors disabled:opacity-50"
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? (dictionary.common?.loading || 'Saving...') : (dictionary.common?.save || 'Save Changes')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
