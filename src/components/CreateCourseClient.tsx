'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Calendar as CalendarIcon, Plus, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUpload } from '@/components/ImageUpload';
import { createCourseAction } from '@/lib/actions/courseActions';
import { getCoachesAction } from '@/lib/actions/userActions';
import { bulkCreateSessionPlansAction } from '@/lib/actions/sessionPlanActions';
import { getAllCategoriesAction } from '@/lib/actions/categoryActions';
import type { Category } from '@/lib/db/repositories/categoryRepository';

interface CreateCourseClientProps {
  locale: string;
  dict: any;
}

interface SessionTemplate {
  sessionNumber: number;
  sessionDate: string;
  dayOfWeek: string;
}

export default function CreateCourseClient({ locale, dict }: CreateCourseClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');
  const [coaches, setCoaches] = useState<Array<{ id: string; fullName?: string; username: string; email: string }>>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sessionTemplates, setSessionTemplates] = useState<SessionTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    category: '',
    price: 0,
    currency: 'OMR',
    duration: 1,
    maxStudents: 0,
    startDate: '',
    endDate: '',
    courseImage: '',
    coachId: '',
    totalSessions: 0,
    sessionDays: [] as string[],
    sessionStartTime: '',
    sessionEndTime: '',
  });

  const weekDays = [
    { key: 'sunday', label: dict.courses?.sunday || 'Sunday', value: 0 },
    { key: 'monday', label: dict.courses?.monday || 'Monday', value: 1 },
    { key: 'tuesday', label: dict.courses?.tuesday || 'Tuesday', value: 2 },
    { key: 'wednesday', label: dict.courses?.wednesday || 'Wednesday', value: 3 },
    { key: 'thursday', label: dict.courses?.thursday || 'Thursday', value: 4 },
    { key: 'friday', label: dict.courses?.friday || 'Friday', value: 5 },
    { key: 'saturday', label: dict.courses?.saturday || 'Saturday', value: 6 },
  ];

  // Sync category
  useEffect(() => {
    if (selectedCategory) {
      setFormData(prev => ({ ...prev, category: selectedCategory }));
    }
  }, [selectedCategory]);

  // Load coaches on mount
  useEffect(() => {
    async function loadCoaches() {
      const result = await getCoachesAction();
      if (result.success && result.coaches) {
        setCoaches(result.coaches);
      }
    }
    loadCoaches();
  }, []);

  // Load categories on mount
  useEffect(() => {
    async function loadCategories() {
      const result = await getAllCategoriesAction();
      if (result.success && result.categories) {
        setCategories(result.categories);
      }
    }
    loadCategories();
  }, []);

  // Generate session templates when dates and training days change
  useEffect(() => {
    if (formData.startDate && formData.endDate && formData.sessionDays.length > 0) {
      generateSessionTemplates();
    } else {
      setSessionTemplates([]);
    }
  }, [formData.startDate, formData.endDate, formData.sessionDays]);

  const generateSessionTemplates = () => {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const templates: SessionTemplate[] = [];
    
    const selectedDayValues = formData.sessionDays.map(dayKey => {
      const day = weekDays.find(d => d.key === dayKey);
      return day ? day.value : -1;
    }).filter(v => v !== -1);

    let currentDate = new Date(start);
    let sessionNumber = 1;

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      
      if (selectedDayValues.includes(dayOfWeek)) {
        const dayName = weekDays.find(d => d.value === dayOfWeek)?.label || '';
        templates.push({
          sessionNumber,
          sessionDate: currentDate.toISOString().split('T')[0],
          dayOfWeek: dayName,
        });
        sessionNumber++;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setSessionTemplates(templates);
    setFormData(prev => ({ ...prev, totalSessions: templates.length }));
  };

  const toggleSessionDay = (dayKey: string) => {
    setFormData((prev) => {
      const exists = prev.sessionDays.includes(dayKey);
      return {
        ...prev,
        sessionDays: exists
          ? prev.sessionDays.filter((day) => day !== dayKey)
          : [...prev.sessionDays, dayKey],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create the course first
      const courseResult = await createCourseAction({
        name: formData.name,
        nameAr: formData.nameAr,
        description: formData.description || undefined,
        descriptionAr: formData.descriptionAr || undefined,
        price: formData.price,
        currency: formData.currency,
        duration: formData.duration,
        maxStudents: formData.maxStudents > 0 ? formData.maxStudents : undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        courseImage: formData.courseImage || undefined,
        coachId: formData.coachId && formData.coachId !== 'none' ? formData.coachId : undefined,
        totalSessions: formData.totalSessions > 0 ? formData.totalSessions : undefined,
        sessionDays: formData.sessionDays.length > 0 ? formData.sessionDays : undefined,
        sessionStartTime: formData.sessionStartTime || undefined,
        sessionEndTime: formData.sessionEndTime || undefined,
      });

      if (!courseResult.success || !courseResult.course) {
        alert(courseResult.error || 'Failed to create course');
        setLoading(false);
        return;
      }

      // Create session plans if templates exist
      if (sessionTemplates.length > 0) {
        const sessionPlans = sessionTemplates.map(template => ({
          courseId: courseResult.course!.id,
          sessionNumber: template.sessionNumber,
          sessionDate: template.sessionDate,
          title: `${dict.courses?.sessionNumber || 'Session #'}${template.sessionNumber}`,
          titleAr: `${dict.courses?.sessionNumber || 'الجلسة رقم'}${template.sessionNumber}`,
          description: '',
          descriptionAr: '',
          objectives: [],
          objectivesAr: [],
          activities: [],
          materials: [],
          materialsAr: [],
          notes: '',
          notesAr: '',
          status: 'planned' as const,
        }));

        await bulkCreateSessionPlansAction(sessionPlans);
      }

      router.push(`/${locale}/dashboard/courses`);
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${locale}/dashboard/courses`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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
            {dict.courses?.createCourse || 'Create New Course'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {locale === 'ar' 
              ? 'أدخل تفاصيل الدورة وقم بتخطيط الجلسات' 
              : 'Enter course details and plan your sessions'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">
              {locale === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {dict.courses?.schedule || 'Schedule'}
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
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
                      {dict.courses?.courseName || 'Course Name (English)'} <span className="text-red-500">*</span>
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
                      {dict.courses?.courseNameAr || 'Course Name (Arabic)'} <span className="text-red-500">*</span>
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

                {/* Course Image Upload */}
                <div className="space-y-2">
                  <Label>
                    {locale === 'ar' ? 'صورة الدورة' : 'Course Image'}
                  </Label>
                  <div className="flex justify-center">
                    <ImageUpload
                      onUpload={(file, croppedImageUrl) => {
                        setFormData({ ...formData, courseImage: croppedImageUrl });
                      }}
                      currentImage={formData.courseImage}
                      aspectRatio={16 / 9}
                      maxSizeMB={3}
                      shape="square"
                    />
                  </div>
                </div>

                {/* Description Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      {dict.courses?.courseDescription || 'Description (English)'}
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Professional football training program..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descriptionAr">
                      {dict.courses?.courseDescriptionAr || 'Description (Arabic)'}
                    </Label>
                    <Textarea
                      id="descriptionAr"
                      value={formData.descriptionAr}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, descriptionAr: e.target.value })}
                      placeholder="برنامج تدريب احترافي..."
                      dir="rtl"
                      rows={4}
                    />
                  </div>
                </div>

                {/* Category Selection */}
                <div className="space-y-2">
                  <Label>{locale === 'ar' ? 'فئة الدورة' : 'Course Category'} <span className="text-red-500">*</span></Label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={locale === 'ar' ? 'اختر فئة' : 'Select category'} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.name}>
                              {locale === 'ar' ? (category.nameAr || category.name) : category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Price, Currency, Duration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      {dict.courses?.price || 'Price'} <span className="text-red-500">*</span>
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
                      {dict.courses?.currency || 'Currency'} <span className="text-red-500">*</span>
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
                      {dict.courses?.durationMonths || 'Duration (months)'} <span className="text-red-500">*</span>
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

                {/* Coach Selection */}
                <div className="space-y-2">
                  <Label htmlFor="coach">
                    {locale === 'ar' ? 'المدرب' : 'Coach'}
                  </Label>
                  <Select
                    value={formData.coachId || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, coachId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={locale === 'ar' ? 'اختر مدرباً' : 'Select a coach'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        {locale === 'ar' ? 'بدون مدرب' : 'No coach'}
                      </SelectItem>
                      {coaches.map((coach) => (
                        <SelectItem key={coach.id} value={coach.id}>
                          {coach.fullName || coach.username} ({coach.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Max Students */}
                <div className="space-y-2">
                  <Label htmlFor="maxStudents">
                    {dict.courses?.maxStudents || 'Max Students'}
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{dict.courses?.sessionPlanning || 'Session Planning'}</CardTitle>
                <CardDescription>
                  {locale === 'ar' 
                    ? 'حدد تواريخ الدورة وأيام التدريب لإنشاء الجلسات تلقائياً'
                    : 'Set course dates and training days to automatically generate sessions'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Start Date and End Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">
                      {dict.courses?.startDate || 'Start Date'} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">
                      {dict.courses?.endDate || 'End Date'} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      min={formData.startDate}
                    />
                  </div>
                </div>

                {/* Session Days */}
                <div className="space-y-2">
                  <Label>{dict.courses?.trainingDays || 'Training Days'} <span className="text-red-500">*</span></Label>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'ar'
                      ? 'اختر الأيام التي سيتم فيها التدريب'
                      : 'Select the days when training will occur'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((day) => {
                      const selected = formData.sessionDays.includes(day.key);
                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => toggleSessionDay(day.key)}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            selected 
                              ? 'bg-[#FF5F02] text-white border-[#FF5F02] shadow-sm' 
                              : 'border-gray-300 text-gray-700 hover:border-[#FF5F02] hover:text-[#FF5F02] dark:border-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Session Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionStartTime">
                      {locale === 'ar' ? 'وقت البدء' : 'Start Time'}
                    </Label>
                    <Input
                      id="sessionStartTime"
                      type="time"
                      value={formData.sessionStartTime}
                      onChange={(e) => setFormData({ ...formData, sessionStartTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionEndTime">
                      {locale === 'ar' ? 'وقت الانتهاء' : 'End Time'}
                    </Label>
                    <Input
                      id="sessionEndTime"
                      type="time"
                      value={formData.sessionEndTime}
                      onChange={(e) => setFormData({ ...formData, sessionEndTime: e.target.value })}
                    />
                  </div>
                </div>

                {/* Generated Sessions Preview */}
                {sessionTemplates.length > 0 && (
                  <div className="space-y-2">
                    <Label>{dict.courses?.sessions || 'Generated Sessions'}</Label>
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium">
                            {dict.courses?.totalSessions || 'Total Sessions'}: {sessionTemplates.length}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {locale === 'ar' 
                              ? 'سيتم إنشاء جلسات فارغة يمكنك تعديلها لاحقاً'
                              : 'Empty sessions will be created that you can edit later'}
                          </p>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-1">
                          {sessionTemplates.map((template) => (
                            <div 
                              key={template.sessionNumber}
                              className="flex items-center justify-between p-2 bg-background rounded text-sm"
                            >
                              <span className="font-medium">
                                {dict.courses?.sessionNumber || 'Session #'}{template.sessionNumber}
                              </span>
                              <span className="text-muted-foreground">
                                {template.dayOfWeek}, {new Date(template.sessionDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <p className="text-sm text-muted-foreground">
                      {locale === 'ar'
                        ? 'بعد إنشاء الدورة، يمكنك تعديل كل جلسة وإضافة الأهداف والأنشطة والمواد'
                        : 'After creating the course, you can edit each session and add objectives, activities, and materials'}
                    </p>
                  </div>
                )}

                {formData.startDate && formData.endDate && formData.sessionDays.length === 0 && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {locale === 'ar'
                        ? 'يرجى اختيار أيام التدريب لإنشاء الجلسات تلقائياً'
                        : 'Please select training days to automatically generate sessions'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                {dict.common?.cancel || 'Cancel'}
              </Button>
              <Button type="submit" disabled={loading} className="bg-[#FF5F02] hover:bg-[#FF5F02]/90">
                <Save className="h-4 w-4 mr-2" />
                {loading 
                  ? (dict.common?.loading || 'Saving...')
                  : (dict.courses?.createCourse || 'Create Course')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
