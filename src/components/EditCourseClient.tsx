'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Calendar as CalendarIcon, Edit3, Plus } from 'lucide-react';
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
import { Course } from '@/lib/db/repositories/courseRepository';
import { SessionPlan } from '@/lib/db/repositories/sessionPlanRepository';
import { CourseCalendar } from './CourseCalendar';

interface EditCourseClientProps {
  locale: 'en' | 'ar';
  dict: any;
  course: Course;
}

export default function EditCourseClient({ locale, dict, course }: EditCourseClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');
  const [coaches, setCoaches] = useState<Array<{ id: string; fullName?: string; username: string; email: string }>>([]);
  const [sessionPlans, setSessionPlans] = useState<SessionPlan[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [formData, setFormData] = useState({
    name: course.name || '',
    nameAr: course.nameAr || '',
    description: course.description || '',
    descriptionAr: course.descriptionAr || '',
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

  // Load coaches on mount
  useEffect(() => {
    async function loadCoaches() {
      const result = await getCoachesAction();
      if (result.success && result.coaches) {
        setCoaches(result.coaches);
      }
    }
    loadCoaches();

    // Check for tab query parameter
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    if (tab && ['basic', 'schedule', 'sessions'].includes(tab)) {
      setCurrentTab(tab);
    }
  }, []);

  // Load session plans when switching to sessions tab
  useEffect(() => {
    if (currentTab === 'sessions') {
      loadSessionPlans();
    }
  }, [currentTab]);

  const loadSessionPlans = async () => {
    setLoadingSessions(true);
    const result = await getSessionPlansAction(course.id);
    if (result.success && result.plans) {
      setSessionPlans(result.plans);
    }
    setLoadingSessions(false);
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

    const result = await updateCourseAction(course.id, {
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
      isActive: formData.isActive,
    });

    if (result.success) {
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
            {dict.courses?.editCourse || 'Edit Course'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {locale === 'ar' 
              ? 'قم بتعديل تفاصيل الدورة والجلسات' 
              : 'Edit course details and manage sessions'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">
              {locale === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {dict.courses?.schedule || 'Schedule'}
            </TabsTrigger>
            <TabsTrigger value="sessions">
              {dict.courses?.sessions || 'Sessions'}
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{locale === 'ar' ? 'معلومات الدورة' : 'Course Information'}</CardTitle>
                <CardDescription>
                  {locale === 'ar' ? 'قم بتعديل الحقول المطلوبة' : 'Update the required fields'}
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
                      dir="rtl"
                      rows={4}
                    />
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
                      <SelectValue />
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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
            <Card>
              <CardHeader>
                <CardTitle>{dict.courses?.schedule || 'Schedule'}</CardTitle>
                <CardDescription>
                  {locale === 'ar' 
                    ? 'قم بتحديث تواريخ وأوقات الدورة'
                    : 'Update course dates and times'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                  />
                </div>

                {/* Session Days */}
                <div className="space-y-2">
                  <Label>{dict.courses?.trainingDays || 'Training Days'}</Label>
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{dict.courses?.sessionPlanning || 'Session Planning'}</CardTitle>
                    <CardDescription>
                      {locale === 'ar' 
                        ? 'قم بإدارة خطط الجلسات للدورة'
                        : 'Manage session plans for this course'}
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddNewSession}
                    className="bg-[#FF5F02] hover:bg-[#FF5F02]/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {locale === 'ar' ? 'إضافة جلسة' : 'Add Session'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingSessions ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-muted-foreground">
                      {dict.common?.loading || 'Loading...'}
                    </div>
                  </div>
                ) : sessionPlans.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>{dict.courses?.noSessionsPlanned || 'No sessions planned for this course'}</p>
                    <p className="text-sm mt-2">
                      {locale === 'ar' 
                        ? 'انقر على "إضافة جلسة" لإنشاء خطة جلسة جديدة'
                        : 'Click "Add Session" to create a new session plan'}
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
                      <h3 className="font-semibold text-lg">
                        {locale === 'ar' ? 'جميع الجلسات' : 'All Sessions'}
                      </h3>
                      <div className="grid gap-2">
                        {sessionPlans.map((plan) => (
                          <Card key={plan.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4 flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold">
                                    {dict.courses?.sessionNumber || 'Session #'}{plan.sessionNumber}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(plan.sessionDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    plan.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                                    plan.status === 'in-progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' :
                                    plan.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
                                    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
                                  }`}>
                                    {dict.courses?.[plan.status] || plan.status}
                                  </span>
                                </div>
                                {plan.title && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {locale === 'ar' ? plan.titleAr || plan.title : plan.title}
                                  </p>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSession(plan)}
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
                  : (dict.common?.save || 'Save Changes')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
