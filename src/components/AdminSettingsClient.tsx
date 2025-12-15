'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Plus, Trash2, Tag } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  getAdminSettingsAction,
  updateAdminSettingsAction,
} from '@/lib/actions/adminSettingsActions';
import {
  getAllCategoriesAction,
  createCategoryAction,
  deleteCategoryAction,
} from '@/lib/actions/categoryActions';
import type { AdminSettings } from '@/lib/db/repositories/adminSettingsRepository';
import type { Category } from '@/lib/db/repositories/categoryRepository';
import toast from 'react-hot-toast';

interface AdminSettingsClientProps {
  locale: string;
  dict: any;
}

export default function AdminSettingsClient({ locale, dict }: AdminSettingsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', nameAr: '' });
  const [addingCategory, setAddingCategory] = useState(false);
  const [formData, setFormData] = useState<Partial<AdminSettings>>({
    fullName: '',
    email: '',
    phoneNumber: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountHolder: '',
    iban: '',
    swiftCode: '',
    paymentInstructions: '',
    paymentInstructionsAr: '',
  });

  useEffect(() => {
    loadSettings();
    loadCategories();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const result = await getAdminSettingsAction();
    if (result.success && result.settings) {
      setFormData(result.settings);
    }
    setLoading(false);
  };

  const loadCategories = async () => {
    const result = await getAllCategoriesAction();
    if (result.success && result.categories) {
      setCategories(result.categories);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name || !newCategory.nameAr) {
      toast.error(locale === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }

    setAddingCategory(true);
    const result = await createCategoryAction(newCategory);
    
    if (result.success) {
      toast.success(locale === 'ar' ? 'تم إضافة الفئة بنجاح' : 'Category added successfully');
      setNewCategory({ name: '', nameAr: '' });
      loadCategories();
      router.refresh();
    } else {
      toast.error(locale === 'ar' ? 'فشل في إضافة الفئة' : 'Failed to add category');
    }
    setAddingCategory(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذه الفئة؟' : 'Are you sure you want to delete this category?')) {
      return;
    }

    const result = await deleteCategoryAction(id);
    if (result.success) {
      toast.success(locale === 'ar' ? 'تم حذف الفئة بنجاح' : 'Category deleted successfully');
      loadCategories();
      router.refresh();
    } else {
      toast.error(locale === 'ar' ? 'فشل في حذف الفئة' : 'Failed to delete category');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateAdminSettingsAction(formData);
    if (result.success) {
      toast.success(locale === 'ar' ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
    } else {
      toast.error(locale === 'ar' ? 'فشل في حفظ الإعدادات' : 'Failed to save settings');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="p-6">{locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#262626] dark:text-white">
          {locale === 'ar' ? 'إعدادات النظام' : 'System Settings'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {locale === 'ar' ? 'إدارة معلومات الحساب البنكي وتعليمات الدفع والفئات' : 'Manage bank account, payment instructions, and categories'}
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-gray-100 dark:bg-[#1a1a1a] p-1 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000]">
          <TabsTrigger value="general" className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#262626] data-[state=active]:shadow-lg rounded-lg transition-all text-gray-600 dark:text-gray-400 data-[state=active]:text-[#FF5F02]">{locale === 'ar' ? 'عام' : 'General'}</TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#262626] data-[state=active]:shadow-lg rounded-lg transition-all text-gray-600 dark:text-gray-400 data-[state=active]:text-[#FF5F02]">
            <Tag className="w-4 h-4 mr-2" />
            {locale === 'ar' ? 'فئات الدورات' : 'Course Categories'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626]">
            <CardHeader className="py-4">
              <CardTitle className="text-[#262626] dark:text-white">{locale === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName" className="text-[#262626] dark:text-white font-semibold">{locale === 'ar' ? 'الاسم الكامل' : 'Full Name'}</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder={locale === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                    className="h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-[#262626] dark:text-white font-semibold">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={locale === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                    className="h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phoneNumber" className="text-[#262626] dark:text-white font-semibold">{locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder={locale === 'ar' ? 'أدخل رقم هاتفك' : 'Enter your phone number'}
                  className="h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] shadow-lg">
            <CardHeader className="py-4">
              <CardTitle className="text-[#262626] dark:text-white">{locale === 'ar' ? 'معلومات الحساب البنكي' : 'Bank Account Information'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bankName" className="text-[#262626] dark:text-white font-semibold">{locale === 'ar' ? 'اسم البنك' : 'Bank Name'}</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder={locale === 'ar' ? 'أدخل اسم البنك' : 'Enter bank name'}
                    className="h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Label htmlFor="bankAccountHolder" className="text-[#262626] dark:text-white font-semibold">{locale === 'ar' ? 'اسم صاحب الحساب' : 'Account Holder Name'}</Label>
                  <Input
                    id="bankAccountHolder"
                    value={formData.bankAccountHolder}
                    onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                    placeholder={locale === 'ar' ? 'أدخل اسم صاحب الحساب' : 'Enter account holder name'}
                    className="h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bankAccountNumber" className="text-[#262626] dark:text-white font-semibold">{locale === 'ar' ? 'رقم الحساب' : 'Account Number'}</Label>
                  <Input
                    id="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    placeholder={locale === 'ar' ? 'أدخل رقم الحساب' : 'Enter account number'}
                    className="h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Label htmlFor="iban" className="text-[#262626] dark:text-white font-semibold">{locale === 'ar' ? 'رقم الآيبان (IBAN)' : 'IBAN'}</Label>
                  <Input
                    id="iban"
                    value={formData.iban}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                    placeholder={locale === 'ar' ? 'أدخل رقم الآيبان' : 'Enter IBAN'}
                    className="h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="swiftCode" className="text-[#262626] dark:text-white font-semibold">{locale === 'ar' ? 'رمز السويفت (SWIFT)' : 'SWIFT Code'}</Label>
                <Input
                  id="swiftCode"
                  value={formData.swiftCode}
                  onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })}
                  placeholder={locale === 'ar' ? 'أدخل رمز السويفت' : 'Enter SWIFT code'}
                  className="h-12 bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-[#FF5F02] dark:focus:border-[#FF5F02] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626] shadow-lg">
            <CardHeader className="py-4">
              <CardTitle className="text-[#262626] dark:text-white">{locale === 'ar' ? 'تعليمات الدفع' : 'Payment Instructions'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="paymentInstructions" className="text-[#262626] dark:text-white font-semibold">{locale === 'ar' ? 'التعليمات (إنجليزي)' : 'Instructions (English)'}</Label>
                <Textarea
                  id="paymentInstructions"
                  value={formData.paymentInstructions}
                  onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
                  placeholder="Please transfer the amount to the account above and upload the receipt..."
                  rows={4}
                  className="resize-none bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-gray-400 dark:focus:border-gray-600 text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
              <div>
                <Label htmlFor="paymentInstructionsAr" className="text-[#262626] dark:text-white font-semibold">{locale === 'ar' ? 'التعليمات (عربي)' : 'Instructions (Arabic)'}</Label>
                <Textarea
                  id="paymentInstructionsAr"
                  value={formData.paymentInstructionsAr}
                  onChange={(e) => setFormData({ ...formData, paymentInstructionsAr: e.target.value })}
                  placeholder="يرجى تحويل المبلغ إلى الحساب أعلاه ورفع إيصال الدفع..."
                  dir="rtl"
                  rows={4}
                  className="resize-none bg-white dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-gray-400 dark:focus:border-gray-600 text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="h-12 bg-[#262626] hover:bg-black text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black active:scale-95 transition-transform">
              <Save className="h-4 w-4 mr-2" />
              {saving ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (locale === 'ar' ? 'حفظ الإعدادات' : 'Save Settings')}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <Card className="border-2 border-[#DDDDDD] dark:border-[#000000] bg-white dark:bg-[#262626]">
            <CardHeader className="py-4">
              <CardTitle className="text-[#262626] dark:text-white">{locale === 'ar' ? 'إدارة الفئات' : 'Category Management'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Category */}
              <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-100 dark:bg-[#1a1a1a] p-4 rounded-lg border-2 border-[#DDDDDD] dark:border-[#000000]">
                <div className="flex-1 space-y-2 w-full">
                  <Label className="text-[#262626] dark:text-white font-semibold">{locale === 'ar' ? 'اسم الفئة (إنجليزي)' : 'Category Name (English)'}</Label>
                  <Input
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="e.g. Football"
                    className="h-12 bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-gray-400 dark:focus:border-gray-600 text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
                <div className="flex-1 space-y-2 w-full">
                  <Label className="text-[#262626] dark:text-white font-semibold">{locale === 'ar' ? 'اسم الفئة (عربي)' : 'Category Name (Arabic)'}</Label>
                  <Input
                    value={newCategory.nameAr}
                    onChange={(e) => setNewCategory({ ...newCategory, nameAr: e.target.value })}
                    placeholder="مثال: كرة القدم"
                    dir="rtl"
                    className="h-12 bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] focus:border-gray-400 dark:focus:border-gray-600 text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
                <Button onClick={handleAddCategory} disabled={addingCategory} className="h-12 bg-[#262626] hover:bg-black text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black active:scale-95 transition-transform">
                  <Plus className="w-4 h-4 mr-2" />
                  {addingCategory ? (locale === 'ar' ? 'جاري الإضافة...' : 'Adding...') : (locale === 'ar' ? 'إضافة' : 'Add')}
                </Button>
              </div>

              {/* Categories List */}
              <div className="space-y-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 border-2 border-[#DDDDDD] dark:border-[#000000] rounded-lg bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#0a0a0a] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-black/5 dark:bg-white/5 rounded-full text-gray-700 dark:text-gray-200">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-[#262626] dark:text-white">{category.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{category.nameAr}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950/30 active:scale-95 transition-all"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {categories.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {locale === 'ar' ? 'لا توجد فئات مضافة' : 'No categories added yet'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
