'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Save, Calendar as CalendarIcon, Edit3, Plus, Sparkles, ChevronLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUpload } from '@/components/ImageUpload';
import { updateCourseAction } from '@/lib/actions/courseActions';
import { getCoachesAction } from '@/lib/actions/userActions';
import { getSessionPlansAction } from '@/lib/actions/sessionPlanActions';
import { getAllCategoriesAction } from '@/lib/actions/categoryActions';
import type { Course } from '@/lib/db/repositories/courseRepository';
import type { SessionPlan } from '@/lib/db/repositories/sessionPlanRepository';
import type { Category } from '@/lib/db/repositories/categoryRepository';
import { CourseCalendar } from './CourseCalendar';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Locale } from '@/config/i18n';

interface EditCourseClientProps {
  locale: Locale;
  dict: Dictionary;
  course: Course;
}

export default function EditCourseClient({ locale, dict, course }: EditCourseClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');
  const [coaches, setCoaches] = useState<Array<{ id: string; fullName?: string; username: string; email: string }>>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sessionPlans, setSessionPlans] = useState<SessionPlan[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const loadSessionPlans = useCallback(async () => {
    setLoadingSessions(true);
    const result = await getSessionPlansAction(course.id);
    if (result.success && result.plans) {
      setSessionPlans(result.plans);
    }
    setLoadingSessions(false);
  }, [course.id]);

  const [formData, setFormData] = useState({
    name: course.name || '',
    nameAr: course.nameAr || '',
    description: course.description || '',
    descriptionAr: course.descriptionAr || '',
    category: course.category || '',
    price: course.price || 0,
    currency: course.currency || 'OMR',
    duration: course.duration || 1,
    maxStudents: course.maxStudents || 0,
    startDate: course.startDate ? course.startDate.split('T')[0] : '',
    endDate: course.endDate ? course.endDate.split('T')[0] : '',
    courseImage: course.courseImage || '',
    coachId: course.coachId || '',
    totalSessions: course.totalSessions || 0,
    sessionDays: course.sessionDays || [],
    sessionStartTime: course.sessionStartTime || '',
    sessionEndTime: course.sessionEndTime || '',
    isActive: course.isActive,
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

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      // Load coaches
      const coachesResult = await getCoachesAction();
      if (coachesResult.success && coachesResult.coaches) {
        setCoaches(coachesResult.coaches);
      }

      // Load categories
      const categoriesResult = await getAllCategoriesAction();
      if (categoriesResult.success && categoriesResult.categories) {
        setCategories(categoriesResult.categories);
        
        // Initialize category selection
        if (course.category) {
          const categoryExists = categoriesResult.categories.some(c => c.name === course.category);
          if (categoryExists) {
            setSelectedCategory(course.category);
          }
        }
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSessionPlans();
  }, []);

  // Sync category
  useEffect(() => {
    if (selectedCategory) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(prev => ({ ...prev, category: selectedCategory }));
    }
  }, [selectedCategory]);

  useEffect(() => {
    // Check for tab query parameter
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    if (tab && ['basic', 'schedule', 'sessions'].includes(tab)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentTab(tab);
    }
  }, []);

  // Load session plans when switching to sessions tab
  useEffect(() => {
    if (currentTab === 'sessions') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadSessionPlans();
    }
  }, [currentTab, loadSessionPlans]);

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

    const result = await updateCourseAction(course.id, {
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
      isActive: formData.isActive,
    }, locale);

    if (result.success) {
      router.refresh();
      router.push(`/${locale}/dashboard/courses`);
    } else {
      alert(result.error || 'Failed to update course');
    }
    setLoading(false);
  };

  const handleCancel = () => {
    router.push(`/${locale}/dashboard/courses`);
  };

  const handleEditSession = (session: SessionPlan) => {
    router.push(`/${locale}/dashboard/courses/${course.id}/sessions/${session.id}/edit`);
  };

  const handleAddNewSession = () => {
    router.push(`/${locale}/dashboard/courses/${course.id}/sessions/new`);
  };

  const getStatusLabel = (status: string) => {
    if (status === 'in-progress') return dict.courses?.inProgress || 'In Progress';
    if (status === 'planned') return dict.courses?.planned || 'Planned';
    if (status === 'completed') return dict.courses?.completed || 'Completed';
    if (status === 'cancelled') return dict.courses?.cancelled || 'Cancelled';
    return status;
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === 'completed') return 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30';
    if (status === 'in-progress') return 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/30';
    if (status === 'cancelled') return 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/30';
    return 'bg-[#FF5F02]/15 text-orange-200 ring-1 ring-[#FF5F02]/30';
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
                  {dict.courses?.editCourse || 'Edit Course'}
                </h1>
                <p className="mt-1 text-sm text-white/70">
                  {dict.courses?.editCourseSubtitle || ''}
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
          <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-white/5 border border-white/10 p-1">
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
            <TabsTrigger
              value="sessions"
              className="rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              {dict.courses?.sessions || 'Sessions'}
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/25">
              <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-white/5 via-transparent to-white/5" />
              <CardHeader>
                <CardTitle className="text-white">{dict.courses?.courseInformation || 'Course Information'}</CardTitle>
                <CardDescription className="text-white/60">
                  {dict.courses?.updateRequiredFields || ''}
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
                      className="h-11 rounded-2xl bg-black/20 border border-white/10 text-white focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
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
                      dir="rtl"
                      className="h-11 rounded-2xl bg-black/20 border border-white/10 text-white focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
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
                      rows={4}
                      className="rounded-2xl bg-black/20 border border-white/10 text-white focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
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
                      dir="rtl"
                      rows={4}
                      className="rounded-2xl bg-black/20 border border-white/10 text-white focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
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
                      className="h-11 rounded-2xl bg-black/20 border border-white/10 text-white focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
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
                      className="h-11 rounded-2xl bg-black/20 border border-white/10 text-white focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
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
                      className="h-11 rounded-2xl bg-black/20 border border-white/10 text-white focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
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
                      <SelectValue />
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

                {/* Max Students and Active Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="h-11 rounded-2xl bg-black/20 border border-white/10 text-white focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="isActive">
                      {locale === 'ar' ? 'الحالة' : 'Status'}
                    </Label>
                    <Select
                      value={formData.isActive ? 'active' : 'inactive'}
                      onValueChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}
                    >
                      <SelectTrigger className="h-11 rounded-2xl bg-black/20 border border-white/10 text-white hover:bg-white/5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0b0b10] border border-white/10 text-white">
                        <SelectItem value="active">{dict.courses?.active || 'Active'}</SelectItem>
                        <SelectItem value="inactive">{dict.courses?.inactive || 'Inactive'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/25">
              <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-white/5 via-transparent to-white/5" />
              <CardHeader>
                <CardTitle>{dict.courses?.schedule || 'Schedule'}</CardTitle>
                <CardDescription className="text-white/60">
                  {dict.courses?.updateScheduleSubtitle || ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-6">
                {/* Start Date and End Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">
                      {dict.courses?.startDate || 'Start Date'}
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="h-11 rounded-2xl bg-black/20 border border-white/10 text-white focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">
                      {dict.courses?.endDate || 'End Date'}
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      min={formData.startDate}
                      className="h-11 rounded-2xl bg-black/20 border border-white/10 text-white focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
                    />
                  </div>
                </div>

                {/* Total Sessions */}
                <div className="space-y-2">
                  <Label htmlFor="totalSessions">
                    {dict.courses?.totalSessions || 'Total Sessions'}
                  </Label>
                  <Input
                    id="totalSessions"
                    type="number"
                    min="0"
                    value={formData.totalSessions}
                    onChange={(e) => setFormData({ ...formData, totalSessions: parseInt(e.target.value) || 0 })}
                    className="h-11 rounded-2xl bg-black/20 border border-white/10 text-white focus-visible:ring-0 focus-visible:border-[#FF5F02]/60"
                  />
                </div>

                {/* Session Days */}
                <div className="space-y-2">
                  <Label>{dict.courses?.trainingDays || 'Training Days'}</Label>
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/25">
              <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-white/5 via-transparent to-white/5" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{dict.courses?.sessionPlanning || 'Session Planning'}</CardTitle>
                    <CardDescription className="text-white/60">
                      {dict.courses?.sessionPlanningSubtitle || ''}
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddNewSession}
                    className="rounded-2xl bg-linear-to-r from-[#FF5F02] to-orange-600 text-white shadow-lg shadow-orange-500/20 hover:from-[#FF5F02]/90 hover:to-orange-600/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {dict.courses?.addSession || 'Add Session'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="relative">
                {loadingSessions ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-white/60">
                      {dict.common?.loading || 'Loading...'}
                    </div>
                  </div>
                ) : sessionPlans.length === 0 ? (
                  <div className="text-center py-12 text-white/60">
                    <p>{dict.courses?.noSessionsPlanned || 'No sessions planned for this course'}</p>
                    <p className="text-sm mt-2">
                      {dict.courses?.addSessionHint || ''}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Calendar View */}
                    <CourseCalendar 
                      courseId={course.id}
                      locale={locale}
                      dictionary={dict}
                      onSessionClick={handleEditSession}
                    />

                    {/* Sessions List */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg text-white">{dict.courses?.allSessions || 'All Sessions'}</h3>
                      <div className="grid gap-2">
                        {sessionPlans.map((plan) => (
                          <Card
                            key={plan.id}
                            className="rounded-2xl border border-white/10 bg-black/20 hover:bg-white/5 transition-colors"
                          >
                            <CardContent className="p-4 flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-white">
                                    {dict.courses?.sessionNumber || 'Session #'}{plan.sessionNumber}
                                  </span>
                                  <span className="text-sm text-white/60">
                                    {new Date(plan.sessionDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(plan.status)}`}>
                                    {getStatusLabel(plan.status)}
                                  </span>
                                </div>
                                {plan.title && (
                                  <p className="text-sm text-white/60 mt-1">
                                    {locale === 'ar' ? plan.titleAr || plan.title : plan.title}
                                  </p>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSession(plan)}
                                className="rounded-2xl text-white hover:bg-white/10"
                              >
                                <Edit3 className="h-4 w-4 mr-2" />
                                {dict.common?.edit || 'Edit'}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
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
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                {dict.common?.cancel || 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-linear-to-r from-[#FF5F02] to-orange-600 text-white shadow-lg shadow-orange-500/20 hover:from-[#FF5F02]/90 hover:to-orange-600/90"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading 
                  ? (dict.common?.loading || 'Saving...')
                  : (dict.common?.save || 'Save Changes')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </motion.div>
  );
}
