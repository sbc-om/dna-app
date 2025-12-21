'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Save, Calendar as CalendarIcon, Sparkles, ChevronLeft } from 'lucide-react';
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
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Locale } from '@/config/i18n';

interface CreateCourseClientProps {
  locale: Locale;
  dict: Dictionary;
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

    const currentDate = new Date(start);
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
        category: formData.category || undefined,
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
      }, locale);

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
          titleAr: `${dict.courses?.sessionNumber || 'Session #'}${template.sessionNumber}`,
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

      router.refresh();
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
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/35">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-[#FF5F02]/15 via-purple-500/10 to-cyan-500/10" />
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-linear-to-br from-[#FF5F02]/25 to-purple-500/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, -6, 6, -6, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.5 }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15"
              >
                <Sparkles className="h-5 w-5 text-[#FF5F02]" />
              </motion.div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {dict.courses?.createCourse || 'Create Course'}
                </h1>
                <p className="mt-1 text-sm text-white/70">
                  {dict.courses?.createCourseSubtitle || ''}
                </p>
              </div>
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="self-start">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="h-11 rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
            >
              <ChevronLeft className={`h-4 w-4 ${locale === 'ar' ? 'rotate-180 ml-2' : 'mr-2'}`} />
              {dict.common?.back || dict.common?.cancel || 'Back'}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-white/5 border border-white/10 p-1">
            <TabsTrigger
              value="basic"
              className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              {dict.courses?.basicInformation || 'Basic Information'}
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {dict.courses?.schedule || 'Schedule'}
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/25">
              <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-white/5 via-transparent to-white/5" />
              <CardHeader>
                <CardTitle className="text-white">{dict.courses?.courseInformation || 'Course Information'}</CardTitle>
                <CardDescription className="text-white/60">
                  {dict.courses?.fillRequiredFields || ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-6">
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
                      placeholder={dict.courses?.placeholders?.courseNameEn || 'e.g. Football Training'}
                      className="h-11 rounded-2xl bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
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
                      placeholder={dict.courses?.placeholders?.courseNameAr || 'e.g. Football Training'}
                      dir="rtl"
                      className="h-11 rounded-2xl bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
                    />
                  </div>
                </div>

                {/* Course Image Upload */}
                <div className="space-y-2">
                  <Label>
                    {dict.courses?.courseImage || 'Course Image'}
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
                      placeholder={dict.courses?.placeholders?.courseDescriptionEn || ''}
                      rows={4}
                      className="rounded-2xl bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
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
                      placeholder={dict.courses?.placeholders?.courseDescriptionAr || ''}
                      dir="rtl"
                      rows={4}
                      className="rounded-2xl bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
                    />
                  </div>
                </div>

                {/* Category Selection */}
                <div className="space-y-2">
                  <Label>{dict.courses?.courseCategory || 'Course Category'} <span className="text-red-500">*</span></Label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                      >
                        <SelectTrigger className="h-11 rounded-2xl bg-black/20 border border-white/10 text-white hover:bg-white/5">
                          <SelectValue placeholder={dict.courses?.selectCategory || ''} />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0b0b10] border border-white/10 text-white">
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
                      placeholder={dict.courses?.placeholders?.price || '50.00'}
                      className="h-11 rounded-2xl bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
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
                      placeholder={dict.courses?.placeholders?.currency || 'OMR'}
                      className="h-11 rounded-2xl bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
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
                      placeholder={dict.courses?.placeholders?.duration || '1'}
                      className="h-11 rounded-2xl bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
                    />
                  </div>
                </div>

                {/* Coach Selection */}
                <div className="space-y-2">
                  <Label htmlFor="coach">
                    {dict.courses?.coach || 'Coach'}
                  </Label>
                  <Select
                    value={formData.coachId || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, coachId: value })}
                  >
                    <SelectTrigger className="h-11 rounded-2xl bg-black/20 border border-white/10 text-white hover:bg-white/5">
                      <SelectValue placeholder={dict.courses?.selectCoach || ''} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0b0b10] border border-white/10 text-white">
                      <SelectItem value="none">
                        {dict.courses?.noCoach || 'No coach'}
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
                    placeholder={dict.courses?.unlimitedHint || '0 = unlimited'}
                    className="h-11 rounded-2xl bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
                  />
                  <p className="text-sm text-white/60">{dict.courses?.maxStudentsHint || ''}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/25">
              <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-white/5 via-transparent to-white/5" />
              <CardHeader>
                <CardTitle>{dict.courses?.sessionPlanning || 'Session Planning'}</CardTitle>
                <CardDescription className="text-white/60">
                  {dict.courses?.sessionPlanningSubtitle || ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-6">
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
                      className="h-11 rounded-2xl bg-black/20 border border-white/10 text-white focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
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
                      className="h-11 rounded-2xl bg-black/20 border border-white/10 text-white focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
                    />
                  </div>
                </div>

                {/* Session Days */}
                <div className="space-y-2">
                  <Label>{dict.courses?.trainingDays || 'Training Days'} <span className="text-red-500">*</span></Label>
                  <p className="text-sm text-white/60">{dict.courses?.trainingDaysHint || ''}</p>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((day) => {
                      const selected = formData.sessionDays.includes(day.key);
                      return (
                        <motion.button
                          key={day.key}
                          type="button"
                          onClick={() => toggleSessionDay(day.key)}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            selected 
                              ? 'bg-linear-to-r from-[#FF5F02] to-orange-600 text-white border-[#FF5F02]/50 shadow-lg shadow-orange-500/15'
                              : 'border-white/10 bg-white/5 text-white/80 hover:border-[#FF5F02]/50 hover:text-white'
                          }`}
                        >
                          {day.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Session Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionStartTime">
                      {dict.courses?.startTime || 'Start Time'}
                    </Label>
                    <Input
                      id="sessionStartTime"
                      type="time"
                      value={formData.sessionStartTime}
                      onChange={(e) => setFormData({ ...formData, sessionStartTime: e.target.value })}
                      className="h-11 rounded-2xl bg-black/20 border border-white/10 text-white focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionEndTime">
                      {dict.courses?.endTime || 'End Time'}
                    </Label>
                    <Input
                      id="sessionEndTime"
                      type="time"
                      value={formData.sessionEndTime}
                      onChange={(e) => setFormData({ ...formData, sessionEndTime: e.target.value })}
                      className="h-11 rounded-2xl bg-black/20 border border-white/10 text-white focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
                    />
                  </div>
                </div>

                {/* Generated Sessions Preview */}
                {sessionTemplates.length > 0 && (
                  <div className="space-y-2">
                    <Label>{dict.courses?.generatedSessions || dict.courses?.sessions || 'Generated Sessions'}</Label>
                    <Card className="rounded-3xl border border-white/10 bg-black/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium">
                            {dict.courses?.totalSessions || 'Total Sessions'}: {sessionTemplates.length}
                          </p>
                          <p className="text-sm text-white/60">{dict.courses?.emptySessionsCreated || ''}</p>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-1">
                          {sessionTemplates.map((template) => (
                            <div 
                              key={template.sessionNumber}
                              className="flex items-center justify-between p-2 bg-white/5 border border-white/10 rounded-2xl text-sm"
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
                    <p className="text-sm text-white/60">{dict.courses?.afterCreateHint || ''}</p>
                  </div>
                )}

                {formData.startDate && formData.endDate && formData.sessionDays.length === 0 && (
                  <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-sm text-yellow-200/90">
                      {dict.courses?.selectTrainingDaysToGenerate || ''}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <Card className="mt-6 rounded-3xl border border-white/10 bg-white/5">
          <CardContent className="p-4">
            <div className="flex justify-end gap-3">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                  className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  {dict.common?.cancel || 'Cancel'}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-linear-to-r from-[#FF5F02] to-orange-600 text-white shadow-lg shadow-orange-500/20 hover:from-[#FF5F02]/90 hover:to-orange-600/90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? (dict.common?.loading || 'Saving...') : (dict.courses?.createCourse || 'Create Course')}
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </form>
    </motion.div>
  );
}
