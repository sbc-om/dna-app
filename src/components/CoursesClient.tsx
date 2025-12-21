'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Clock, Users, Search, Filter, Sparkles, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  getAllCoursesAction,
  updateCourseAction,
  deleteCourseAction,
} from '@/lib/actions/courseActions';
import { getAllCategoriesAction } from '@/lib/actions/categoryActions';
import type { Course } from '@/lib/db/repositories/courseRepository';
import type { Category } from '@/lib/db/repositories/categoryRepository';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Locale } from '@/config/i18n';

interface CoursesClientProps {
  locale: Locale;
  dict: Dictionary;
}

export default function CoursesClient({ locale, dict }: CoursesClientProps) {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const ALL_CATEGORIES = '__ALL__';
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [coursesResult, categoriesResult] = await Promise.all([
        getAllCoursesAction(locale),
        getAllCategoriesAction(),
      ]);

      if (coursesResult.success && coursesResult.courses) {
        setCourses(coursesResult.courses);
      } else if (!coursesResult.success) {
        toast.error(coursesResult.error || dict.errors?.unauthorized || dict.common?.error || 'Failed to load courses');
      }

      if (categoriesResult.success && categoriesResult.categories) {
        setCategories(categoriesResult.categories);
      } else if (!categoriesResult.success) {
        toast.error(categoriesResult.error || dict.common?.error || 'Failed to load categories');
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error(dict.common?.error || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  // Use all available categories for filtering
  const filterOptions = [ALL_CATEGORIES, ...categories.map((c) => c.name)];

  const getCategoryLabel = (name: string) => {
    if (name === ALL_CATEGORIES) return dict.courses?.allCategories || 'All';
    const category = categories.find(c => c.name === name);
    return category ? (locale === 'ar' ? category.nameAr : category.name) : name;
  };

  const filteredCourses = courses.filter(course => {
    // Category filter
    if (selectedCategory !== ALL_CATEGORIES && course.category !== selectedCategory) {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const name = (course.name || '').toLowerCase();
      const nameAr = (course.nameAr || '').toLowerCase();
      const description = (course.description || '').toLowerCase();
      const descriptionAr = (course.descriptionAr || '').toLowerCase();
      
      return name.includes(query) || 
             nameAr.includes(query) || 
             description.includes(query) || 
             descriptionAr.includes(query);
    }
    
    return true;
  });

  const handleEditNavigate = (courseId: string) => {
    router.push(`/${locale}/dashboard/courses/${courseId}/edit`);
  };

  const handleToggleActive = async (course: Course) => {
    const nextActive = !course.isActive;
    setCourses((prev) => prev.map((c) => (c.id === course.id ? { ...c, isActive: nextActive } : c)));

    const result = await updateCourseAction(course.id, { isActive: nextActive }, locale);
    if (!result.success) {
      setCourses((prev) => prev.map((c) => (c.id === course.id ? { ...c, isActive: course.isActive } : c)));
      toast.error(result.error || dict.common?.error || 'Failed to update course');
      return;
    }

    toast.success(dict.common?.saved || dict.common?.success || 'Saved');
    void loadData();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (confirm(dict.courses?.confirmDelete || dict.common?.confirmDelete || 'Are you sure you want to delete this item?')) {
      const prev = courses;
      setCourses((cur) => cur.filter((c) => c.id !== id));

      const result = await deleteCourseAction(id, locale);
      if (!result.success) {
        setCourses(prev);
        toast.error(result.error || dict.common?.error || 'Failed to delete course');
        return;
      }

      toast.success(dict.common?.deleted || dict.common?.success || 'Deleted');
      void loadData();
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-10 w-10 rounded-full border-2 border-white/10 border-t-[#FF5F02]"
        />
        <span className="ml-3 text-sm text-white/70">{dict.common?.loading || 'Loading...'}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40">
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
                <Trophy className="h-5 w-5 text-[#FF5F02]" />
              </motion.div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {dict.courses?.title || 'Courses'}
                </h1>
                <p className="mt-1 text-sm text-white/70">
                  {dict.courses?.description || ''}
                </p>
              </div>
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => router.push(`/${locale}/dashboard/courses/new`)}
              className="h-11 rounded-2xl bg-linear-to-r from-[#FF5F02] to-orange-600 text-white shadow-lg shadow-orange-500/20 hover:from-[#FF5F02]/90 hover:to-orange-600/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="font-semibold">{dict.courses?.createCourse || dict.common?.create || 'Create'}</span>
              <Sparkles className="h-4 w-4 ml-2 text-white/80" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/30">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-white/5 via-transparent to-white/5" />
        <CardContent className="relative pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                className={`absolute top-3.5 h-5 w-5 text-[#FF5F02] ${locale === 'ar' ? 'right-3' : 'left-3'}`}
              />
              <Input
                placeholder={dict.courses?.searchPlaceholder || dict.common?.search || 'Search'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${locale === 'ar' ? 'pr-10' : 'pl-10'} h-12 rounded-2xl bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:border-[#FF5F02]/60`}
              />
            </div>

            {/* Category Filter Select */}
            <div className="w-full md:w-72 flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-white/10 ring-1 ring-white/10">
                <Filter className="h-5 w-5 text-[#FF5F02]" />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full h-12 rounded-2xl bg-black/20 border border-white/10 text-white hover:bg-white/5 focus:ring-0 focus:border-[#FF5F02]/60">
                  <SelectValue placeholder={dict.courses?.selectCategory || ''} />
                </SelectTrigger>
                <SelectContent className="bg-[#0b0b10] border border-white/10 text-white">
                  {filterOptions.map((option) => (
                    <SelectItem
                      key={option}
                      value={option}
                      className="cursor-pointer text-white hover:bg-white/10 focus:bg-white/10"
                    >
                      {getCategoryLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#FF5F02]/20 bg-[#FF5F02]/10 px-4 py-2">
            <motion.div
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-2.5 w-2.5 rounded-full bg-[#FF5F02]"
            />
            <span className="text-sm font-medium text-white/90">
              {(dict.courses?.showingResults || 'Showing {shown} of {total} courses')
                .replace('{shown}', String(filteredCourses.length))
                .replace('{total}', String(courses.length))}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredCourses.map((course, index) => {
            const courseName = locale === 'ar' ? course.nameAr || course.name : course.name;
            const courseDescription = locale === 'ar' ? course.descriptionAr || course.description : course.description;

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 18 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, rotateX: 1.5, rotateY: locale === 'ar' ? -1.5 : 1.5 }}
                style={{ transformStyle: 'preserve-3d' }}
                className="h-full"
              >
                <Card className="relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/25">
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-white/5" />
                  <div className="pointer-events-none absolute -top-20 -right-24 h-56 w-56 rounded-full bg-linear-to-br from-[#FF5F02]/20 to-purple-500/20 blur-3xl" />

                  {course.courseImage ? (
                    <div className="relative h-40 w-full overflow-hidden">
                      <img
                        src={course.courseImage}
                        alt={courseName || 'Course'}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
                    </div>
                  ) : (
                    <div className="relative h-40 w-full overflow-hidden bg-linear-to-br from-[#FF5F02]/20 via-purple-500/10 to-cyan-500/10">
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
                    </div>
                  )}

                  <CardHeader className="relative">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-xl text-white line-clamp-1">{courseName}</CardTitle>
                        <CardDescription className="mt-2 text-white/60 line-clamp-2">
                          {courseDescription || ''}
                        </CardDescription>
                        {course.category && (
                          <Badge
                            variant="outline"
                            className="mt-3 rounded-full border-white/15 bg-white/5 text-white/80"
                          >
                            {getCategoryLabel(course.category)}
                          </Badge>
                        )}
                      </div>
                      <Badge
                        className={
                          course.isActive
                            ? 'rounded-full bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30'
                            : 'rounded-full bg-white/10 text-white/70 ring-1 ring-white/10'
                        }
                      >
                        {course.isActive
                          ? dict.courses?.active || 'Active'
                          : dict.courses?.inactive || 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="relative space-y-4">
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <span className="text-sm text-white/60">{dict.courses?.price || 'Price'}</span>
                      <span className="text-sm font-semibold text-white">
                        {course.price} {course.currency}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                        <Clock className="h-4 w-4 text-[#FF5F02]" />
                        <span className="text-xs text-white/80">
                          {course.duration} {dict.courses?.months || 'months'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                        <Users className="h-4 w-4 text-[#FF5F02]" />
                        <span className="text-xs text-white/80">
                          {course.maxStudents ? course.maxStudents : '∞'} {dict.courses?.students || 'Students'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-white/10">
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditNavigate(course.id)}
                          className="w-full rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                        >
                          <Edit className="h-3.5 w-3.5 mr-2" />
                          {dict.common?.edit || 'Edit'}
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(course)}
                          className="w-full rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                        >
                          {course.isActive
                            ? dict.courses?.deactivate || 'Deactivate'
                            : dict.courses?.activate || 'Activate'}
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(course.id)}
                          className="rounded-2xl"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
