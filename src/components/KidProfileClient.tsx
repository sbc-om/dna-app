'use client';

import { User } from '@/lib/db/repositories/userRepository';
import { AuthUser } from '@/lib/auth/auth';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { Locale } from '@/config/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { UserCircle, Trophy, Activity, Star, Calendar, CreditCard, Edit, BookOpen, Save, Trash2, Pencil } from 'lucide-react';
import { PlayerCardGenerator } from '@/components/PlayerCardGenerator';
import { PlayerCardDisplay } from '@/components/PlayerCardDisplay';
import { ImageUpload } from '@/components/ImageUpload';
import { getPlayerCardAction } from '@/lib/actions/playerCardActions';
import { updateUserProfilePictureAction } from '@/lib/actions/userActions';
import { getEnrollmentsByStudentIdAction, updateEnrollmentCourseAction, createEnrollmentAction, deleteEnrollmentAction } from '@/lib/actions/enrollmentActions';
import { getActiveCoursesAction } from '@/lib/actions/courseActions';
import { useEffect, useState } from 'react';
import { PlayerCardData } from '@/lib/db/repositories/playerCardRepository';
import type { Enrollment } from '@/lib/db/repositories/enrollmentRepository';
import type { Course } from '@/lib/db/repositories/courseRepository';

interface KidProfileClientProps {
  dictionary: Dictionary;
  locale: Locale;
  kid: User | any;
  currentUser: AuthUser | any;
}

export function KidProfileClient({
  dictionary,
  locale,
  kid,
  currentUser,
}: KidProfileClientProps) {
  const [playerCard, setPlayerCard] = useState<PlayerCardData | null>(null);
  const [loadingCard, setLoadingCard] = useState(true);
  const [currentKid, setCurrentKid] = useState<User>(kid);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [savingCourse, setSavingCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState(false);
  const [editingEnrollmentId, setEditingEnrollmentId] = useState<string | null>(null);
  const [deletingEnrollmentId, setDeletingEnrollmentId] = useState<string | null>(null);

  const handleImageUpload = async (file: File, croppedImageUrl: string) => {
    try {
      const result = await updateUserProfilePictureAction(currentKid.id, croppedImageUrl);
      if (result.success && result.user) {
        setCurrentKid(result.user);
      } else {
        alert(result.error || 'Failed to update profile picture');
      }
    } catch (error) {
      console.error('Profile picture upload error:', error);
      alert('Failed to upload profile picture');
    }
  };

  useEffect(() => {
    loadEnrollmentAndCourses();
    
    // Only load player card for admin
    if (currentUser.role !== 'admin') {
      setLoadingCard(false);
      return;
    }

    async function loadPlayerCard() {
      try {
        const result = await getPlayerCardAction(kid.id);
        if (result.success && result.card) {
          setPlayerCard(result.card);
        }
      } catch (error) {
        console.error('Failed to load player card:', error);
      } finally {
        setLoadingCard(false);
      }
    }
    loadPlayerCard();
  }, [kid.id, currentUser.role]);

  const loadEnrollmentAndCourses = async () => {
    // Load kid's enrollments (can have multiple)
    const enrollmentResult = await getEnrollmentsByStudentIdAction(kid.id);
    if (enrollmentResult.success && enrollmentResult.enrollments) {
      setEnrollments(enrollmentResult.enrollments as any);
    }

    // Load available courses (for admin to add new course)
    if (currentUser.role === 'admin') {
      const coursesResult = await getActiveCoursesAction();
      if (coursesResult.success && coursesResult.courses) {
        setAvailableCourses(coursesResult.courses);
      }
    }
  };

  const handleSaveCourse = async () => {
    if (!selectedCourseId) return;
    
    setSavingCourse(true);
    
    try {
      if (editingEnrollmentId) {
        // Update existing enrollment
        const result = await updateEnrollmentCourseAction(editingEnrollmentId, selectedCourseId);
        if (result.success) {
          await loadEnrollmentAndCourses();
          setEditingCourse(false);
          setEditingEnrollmentId(null);
          setSelectedCourseId('');
        } else {
          alert(result.error || 'Failed to update course');
        }
      } else {
        // Create new enrollment
        const result = await createEnrollmentAction({
          studentId: kid.id,
          courseId: selectedCourseId,
          parentId: kid.parentId || '',
        });
        if (result.success) {
          await loadEnrollmentAndCourses();
          setEditingCourse(false);
          setSelectedCourseId('');
        } else {
          alert(result.error || 'Failed to add course');
        }
      }
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Failed to save course');
    }
    
    setSavingCourse(false);
  };

  const handleEditEnrollment = (enrollment: any) => {
    setEditingEnrollmentId(enrollment.id);
    setSelectedCourseId(enrollment.courseId);
    setEditingCourse(true);
  };

  const handleDeleteEnrollment = async (enrollmentId: string) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذه الدورة؟' : 'Are you sure you want to delete this course?')) {
      return;
    }

    setDeletingEnrollmentId(enrollmentId);
    const result = await deleteEnrollmentAction(enrollmentId);
    
    if (result.success) {
      await loadEnrollmentAndCourses();
    } else {
      alert(result.error || 'Failed to delete enrollment');
    }
    setDeletingEnrollmentId(null);
  };

  const handleCancelEdit = () => {
    setEditingCourse(false);
    setEditingEnrollmentId(null);
    setSelectedCourseId('');
  };

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {currentUser.role === 'admin' && (
              <div className="flex flex-col items-center gap-3">
                <ImageUpload
                  onUpload={handleImageUpload}
                  currentImage={currentKid.profilePicture}
                  aspectRatio={1}
                  maxSizeMB={2}
                />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">{currentKid.fullName || currentKid.username}</h1>
                {currentUser.role === 'admin' && (
                  <Button
                    onClick={() => window.location.href = `/${locale}/dashboard/kids/${currentKid.id}/edit`}
                    variant="outline"
                    size="sm"
                    className="border-[#30B2D2] text-[#30B2D2] hover:bg-[#30B2D2] hover:text-white"
                  >
                    <Edit className="h-4 w-4 me-2" />
                    {dictionary.users.editUser}
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <Badge variant="outline" className="text-sm">
                  {dictionary.users.role}: {dictionary.users.roles.kid}
                </Badge>
                {currentKid.nationalId && (
                  <Badge variant="secondary" className="text-sm">
                    {dictionary.users.nationalId}: {currentKid.nationalId}
                  </Badge>
                )}
                {currentKid.birthDate && (
                  <Badge variant="secondary" className="text-sm">
                    Birth: {new Date(currentKid.birthDate).toLocaleDateString(locale)}
                  </Badge>
                )}
              </div>
              <div className="text-gray-500 space-y-1">
                {currentKid.school && <p>🏫 {currentKid.school} {currentKid.grade && `- Grade ${currentKid.grade}`}</p>}
                {currentKid.position && <p>⚽ Position: {currentKid.position}</p>}
                <p className="text-sm">
                  {dictionary.users.createdAt}: {new Date(currentKid.createdAt).toLocaleDateString(locale)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Activities, Scores, etc. */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className={`grid w-full ${currentUser.role === 'admin' ? 'grid-cols-4 lg:w-[500px]' : 'grid-cols-3 lg:w-[400px]'}`}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {currentUser.role === 'admin' && (
            <TabsTrigger value="playercard">
              <CreditCard className="h-4 w-4 me-2" />
              Player Card
            </TabsTrigger>
          )}
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="scores">Scores</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Courses Information Card */}
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">
                    {locale === 'ar' ? 'الدورات التدريبية' : 'Training Courses'}
                  </CardTitle>
                </div>
                {currentUser.role === 'admin' && availableCourses.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => editingCourse ? handleCancelEdit() : setEditingCourse(true)}
                    className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                  >
                    {editingCourse ? (locale === 'ar' ? 'إلغاء' : 'Cancel') : (
                      <>
                        <BookOpen className="h-4 w-4 me-1" />
                        {locale === 'ar' ? 'إضافة دورة' : 'Add Course'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingCourse && currentUser.role === 'admin' ? (
                <div className="space-y-4">
                  <div>
                    <Label>{locale === 'ar' ? 'اختر الدورة' : 'Select Course'}</Label>
                    <Select
                      value={selectedCourseId}
                      onValueChange={setSelectedCourseId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={locale === 'ar' ? 'اختر دورة جديدة' : 'Select new course'} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCourses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {locale === 'ar' ? course.nameAr : course.name} - {course.price} {course.currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleSaveCourse}
                    disabled={savingCourse || !selectedCourseId}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 me-2" />
                    {savingCourse ? (locale === 'ar' ? 'جاري الإضافة...' : 'Adding...') : (locale === 'ar' ? 'إضافة الدورة' : 'Add Course')}
                  </Button>
                </div>
              ) : enrollments.length > 0 ? (
                <div className="space-y-3">
                  {enrollments.map((enrollment: any) => {
                    const isDeleting = deletingEnrollmentId === enrollment.id;
                    
                    return (
                      <div key={enrollment.id} className="bg-white p-4 rounded-lg border border-blue-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-blue-900 mb-2">
                              {locale === 'ar' ? enrollment.course?.nameAr : enrollment.course?.name}
                            </h3>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-gray-600">
                                {locale === 'ar' ? 'الرسوم:' : 'Fee:'}
                              </span>
                              <span className="font-bold text-lg text-blue-600">
                                {enrollment.course?.price} {enrollment.course?.currency}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">
                                {locale === 'ar' ? 'حالة الدفع:' : 'Payment Status:'}
                              </span>
                              <Badge className={
                                enrollment.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                enrollment.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {enrollment.paymentStatus === 'paid' ? (locale === 'ar' ? 'مدفوع' : 'Paid') :
                                 enrollment.paymentStatus === 'pending' ? (locale === 'ar' ? 'قيد المراجعة' : 'Pending') :
                                 (locale === 'ar' ? 'غير مدفوع' : 'Unpaid')}
                              </Badge>
                            </div>
                          </div>
                          {currentUser.role === 'admin' && (
                            <div className="flex gap-2 ms-3">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditEnrollment(enrollment)}
                                disabled={isDeleting}
                                className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                                title={locale === 'ar' ? 'تعديل الدورة' : 'Edit Course'}
                              >
                                <Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteEnrollment(enrollment.id)}
                                disabled={isDeleting}
                                className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900"
                                title={locale === 'ar' ? 'حذف الدورة' : 'Delete Course'}
                              >
                                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {currentUser.role === 'parent' && enrollments.some((e: any) => e.paymentStatus !== 'paid') && (
                    <Button
                      className="w-full bg-[#30B2D2] hover:bg-[#1E3A8A]"
                      onClick={() => window.location.href = `/${locale}/dashboard/payments`}
                    >
                      {locale === 'ar' ? 'الذهاب إلى صفحة الدفع' : 'Go to Payment Page'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  {locale === 'ar' ? 'لم يتم تسجيل الطفل في أي دورة' : 'Not enrolled in any course'}
                  {currentUser.role === 'admin' && availableCourses.length > 0 && (
                    <Button
                      size="sm"
                      onClick={() => setEditingCourse(true)}
                      className="mt-3 bg-blue-600 hover:bg-blue-700"
                    >
                      {locale === 'ar' ? 'تسجيل في دورة' : 'Enroll in Course'}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {currentUser.role === 'admin' && (
          <TabsContent value="playercard" className="space-y-4 mt-4">
            {loadingCard ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">Loading player card...</div>
                </CardContent>
              </Card>
            ) : playerCard ? (
              <PlayerCardDisplay card={playerCard} />
            ) : (
              <PlayerCardGenerator 
                dictionary={dictionary} 
                locale={locale} 
                userId={currentKid.id} 
                userName={currentKid.fullName || currentKid.username} 
              />
            )}
          </TabsContent>
        )}

        <TabsContent value="activities" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                No recent activities found.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scores" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Score History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                No score history available.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
