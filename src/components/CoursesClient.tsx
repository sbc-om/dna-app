'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Clock, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  getAllCoursesAction,
  updateCourseAction,
  deleteCourseAction,
} from '@/lib/actions/courseActions';
import type { Course } from '@/lib/db/repositories/courseRepository';

interface CoursesClientProps {
  locale: string;
  dict: any;
}

export default function CoursesClient({ locale, dict }: CoursesClientProps) {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    const result = await getAllCoursesAction();
    if (result.success && result.courses) {
      setCourses(result.courses);
    }
    setLoading(false);
  };

  const categories = ['All', ...Array.from(new Set(courses.map(c => c.category).filter(Boolean)))];
  const filteredCourses = selectedCategory === 'All' 
    ? courses 
    : courses.filter(c => c.category === selectedCategory);

  const handleEditNavigate = (courseId: string) => {
    router.push(`/${locale}/dashboard/courses/${courseId}/edit`);
  };

  const handleToggleActive = async (course: Course) => {
    await updateCourseAction(course.id, { isActive: !course.isActive });
    loadCourses();
  };

  const handleDelete = async (id: string) => {
    if (confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذه الدورة؟' : 'Are you sure you want to delete this course?')) {
      await deleteCourseAction(id);
      loadCourses();
    }
  };



  if (loading) {
    return <div className="flex items-center justify-center py-12">{locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{locale === 'ar' ? 'إدارة الدورات' : 'Course Management'}</h1>
          <p className="text-muted-foreground mt-1">
            {locale === 'ar' ? 'إدارة الدورات والأسعار' : 'Manage courses and pricing'}
          </p>
        </div>
        <Button onClick={() => router.push(`/${locale}/dashboard/courses/new`)}>
          <Plus className="h-4 w-4 mr-2" />
          {locale === 'ar' ? 'دورة جديدة' : 'New Course'}
        </Button>
      </div>

      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 pb-2">
          {categories.map((category) => (
            <Button
              key={category as string}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category as string)}
              className="rounded-full"
            >
              {category === 'All' ? (locale === 'ar' ? 'الكل' : 'All') : category}
            </Button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-xl">
                    {locale === 'ar' ? course.nameAr : course.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {locale === 'ar' ? course.descriptionAr : course.description}
                  </CardDescription>
                  {course.category && (
                    <Badge variant="outline" className="mt-2">
                      {course.category}
                    </Badge>
                  )}
                </div>
                <Badge variant={course.isActive ? 'default' : 'secondary'}>
                  {course.isActive ? (locale === 'ar' ? 'نشط' : 'Active') : (locale === 'ar' ? 'غير نشط' : 'Inactive')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-sm">
                <span className="font-semibold text-green-600">
                  {course.price} {course.currency}
                </span>
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                <span>
                  {course.duration} {locale === 'ar' ? 'شهر' : 'months'}
                </span>
              </div>
              
              {course.maxStudents && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-2" />
                  <span>
                    {locale === 'ar' ? 'الحد الأقصى:' : 'Max:'} {course.maxStudents} {locale === 'ar' ? 'طالب' : 'students'}
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditNavigate(course.id)}
                  className="flex-1"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  {locale === 'ar' ? 'تعديل' : 'Edit'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(course)}
                  className="flex-1"
                >
                  {course.isActive ? (locale === 'ar' ? 'إلغاء التفعيل' : 'Deactivate') : (locale === 'ar' ? 'تفعيل' : 'Activate')}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(course.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
