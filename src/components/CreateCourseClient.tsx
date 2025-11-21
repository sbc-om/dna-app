'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createCourseAction } from '@/lib/actions/courseActions';

interface CreateCourseClientProps {
  locale: string;
  dict: any;
}

export default function CreateCourseClient({ locale, dict }: CreateCourseClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    price: 0,
    currency: 'OMR',
    duration: 1,
    maxStudents: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createCourseAction({
      name: formData.name,
      nameAr: formData.nameAr,
      description: formData.description || undefined,
      descriptionAr: formData.descriptionAr || undefined,
      price: formData.price,
      currency: formData.currency,
      duration: formData.duration,
      maxStudents: formData.maxStudents > 0 ? formData.maxStudents : undefined,
    });

    if (result.success) {
      router.push(`/${locale}/dashboard/courses`);
    } else {
      alert(result.error || 'Failed to create course');
    }
    setLoading(false);
  };

  const handleCancel = () => {
    router.push(`/${locale}/dashboard/courses`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {locale === 'ar' ? 'إنشاء دورة جديدة' : 'Create New Course'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {locale === 'ar' ? 'أدخل تفاصيل الدورة الجديدة' : 'Enter the details for the new course'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{locale === 'ar' ? 'معلومات الدورة' : 'Course Information'}</CardTitle>
            <CardDescription>
              {locale === 'ar' ? 'املأ جميع الحقول المطلوبة' : 'Fill in all required fields'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {locale === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Football Training"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameAr">
                  {locale === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nameAr"
                  required
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder="تدريب كرة القدم"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Description Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">
                  {locale === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Professional football training program for all ages..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionAr">
                  {locale === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}
                </Label>
                <Textarea
                  id="descriptionAr"
                  value={formData.descriptionAr}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  placeholder="برنامج تدريب كرة قدم احترافي لجميع الأعمار..."
                  dir="rtl"
                  rows={4}
                />
              </div>
            </div>

            {/* Price, Currency, Duration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">
                  {locale === 'ar' ? 'السعر' : 'Price'} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="50.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">
                  {locale === 'ar' ? 'العملة' : 'Currency'} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="currency"
                  required
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  placeholder="OMR"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">
                  {locale === 'ar' ? 'المدة (أشهر)' : 'Duration (months)'} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="duration"
                  type="number"
                  required
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                />
              </div>
            </div>

            {/* Max Students */}
            <div className="space-y-2">
              <Label htmlFor="maxStudents">
                {locale === 'ar' ? 'الحد الأقصى للطلاب' : 'Max Students'}
              </Label>
              <Input
                id="maxStudents"
                type="number"
                min="0"
                value={formData.maxStudents}
                onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) || 0 })}
                placeholder={locale === 'ar' ? '0 = غير محدود' : '0 = unlimited'}
              />
              <p className="text-sm text-muted-foreground">
                {locale === 'ar' 
                  ? 'اترك القيمة 0 إذا كنت لا تريد حد أقصى للطلاب'
                  : 'Leave as 0 if you don\'t want a limit on students'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading 
                  ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                  : (locale === 'ar' ? 'حفظ الدورة' : 'Save Course')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
