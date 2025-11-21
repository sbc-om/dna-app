'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/db/repositories/userRepository';
import { ROLES, UserRole } from '@/config/roles';
import { Dictionary } from '@/lib/i18n/getDictionary';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createUserAction } from '@/lib/actions/userActions';
import { getActiveCoursesAction } from '@/lib/actions/courseActions';
import { createEnrollmentAction } from '@/lib/actions/enrollmentActions';
import type { Course } from '@/lib/db/repositories/courseRepository';

export interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dictionary: Dictionary;
  onUserCreated: (user: User) => void;
  parents?: User[];
  locale: string;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  dictionary,
  onUserCreated,
  parents = [],
  locale,
}: CreateUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    role: ROLES.KID as UserRole,
    parentId: '',
    courseId: '',
  });

  useEffect(() => {
    if (open) {
      loadCourses();
    }
  }, [open]);

  const loadCourses = async () => {
    const result = await getActiveCoursesAction();
    if (result.success && result.courses) {
      setCourses(result.courses);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Create user
    const result = await createUserAction({
      email: formData.email,
      username: formData.username,
      password: formData.password,
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      role: formData.role,
      parentId: formData.role === ROLES.KID && formData.parentId ? formData.parentId : undefined,
    });

    if (result.success && result.user) {
      // If kid with course selected, create enrollment
      if (formData.role === ROLES.KID && formData.courseId && formData.parentId) {
        await createEnrollmentAction({
          studentId: result.user.id,
          courseId: formData.courseId,
          parentId: formData.parentId,
        });
      }

      onUserCreated(result.user);
      onOpenChange(false);
      setFormData({
        email: '',
        username: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        role: ROLES.KID,
        parentId: '',
        courseId: '',
      });
    } else {
      alert(result.error || 'Failed to create user');
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{dictionary.users.createUser}</DialogTitle>
            <DialogDescription>{dictionary.users.userDetails}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{dictionary.common.email}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="username">{dictionary.common.username}</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">{dictionary.common.password}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fullName">{dictionary.common.fullName}</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phoneNumber">{dictionary.common.phoneNumber}</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">{dictionary.users.role}</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as UserRole })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={dictionary.users.role} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES).map(([key, value]) => (
                    <SelectItem key={value} value={value}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Show parent selection for kids */}
            {formData.role === ROLES.KID && parents.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="parentId">
                  {locale === 'ar' ? 'ولي الأمر' : 'Parent'}
                </Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, parentId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={locale === 'ar' ? 'اختر ولي الأمر' : 'Select Parent'} />
                  </SelectTrigger>
                  <SelectContent>
                    {parents.map((parent) => (
                      <SelectItem key={parent.id} value={parent.id}>
                        {parent.fullName} ({parent.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Show course selection for kids */}
            {formData.role === ROLES.KID && courses.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="courseId">
                  {locale === 'ar' ? 'الدورة التدريبية' : 'Course'}
                </Label>
                <Select
                  value={formData.courseId || undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, courseId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={locale === 'ar' ? 'اختر الدورة (اختياري)' : 'Select Course (Optional)'} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {locale === 'ar' ? course.nameAr : course.name} - {course.price} {course.currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {dictionary.common.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? dictionary.common.loading : dictionary.common.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
