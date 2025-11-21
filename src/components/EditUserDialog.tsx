'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/db/repositories/userRepository';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { UserRole, ROLES, ROLE_LABELS } from '@/config/roles';
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
import { Checkbox } from '@/components/ui/checkbox';
import { updateUserAction } from '@/lib/actions/userActions';
import { getActiveCoursesAction } from '@/lib/actions/courseActions';
import { getEnrollmentsByStudentIdAction, updateEnrollmentCourseAction, createEnrollmentAction } from '@/lib/actions/enrollmentActions';
import type { Course } from '@/lib/db/repositories/courseRepository';
import type { Enrollment } from '@/lib/db/repositories/enrollmentRepository';

export interface EditUserDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dictionary: Dictionary;
  onUserUpdated: (user: User) => void;
  locale: string;
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  dictionary,
  onUserUpdated,
  locale,
}: EditUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentEnrollment, setCurrentEnrollment] = useState<Enrollment | null>(null);
  const [formData, setFormData] = useState({
    email: user.email,
    username: user.username,
    password: '',
    fullName: user.fullName || '',
    phoneNumber: user.phoneNumber || '',
    role: user.role,
    isActive: user.isActive,
    courseId: '',
  });

  useEffect(() => {
    if (open && user.role === ROLES.KID) {
      loadCoursesAndEnrollment();
    }
  }, [open, user.role]);

  const loadCoursesAndEnrollment = async () => {
    // Load active courses
    const coursesResult = await getActiveCoursesAction();
    if (coursesResult.success && coursesResult.courses) {
      setCourses(coursesResult.courses);
    }

    // Load current enrollment
    const enrollmentsResult = await getEnrollmentsByStudentIdAction(user.id);
    if (enrollmentsResult.success && enrollmentsResult.enrollments && enrollmentsResult.enrollments.length > 0) {
      const enrollment = enrollmentsResult.enrollments[0];
      setCurrentEnrollment(enrollment);
      setFormData(prev => ({ ...prev, courseId: enrollment.courseId }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const updateData: any = {
      email: formData.email,
      username: formData.username,
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      role: formData.role,
      isActive: formData.isActive,
    };

    if (formData.password) {
      updateData.password = formData.password;
    }

    const result = await updateUserAction(user.id, updateData);

    if (result.success && result.user) {
      // Handle enrollment changes for kids
      if (user.role === ROLES.KID && formData.courseId) {
        if (currentEnrollment) {
          // Update existing enrollment
          if (currentEnrollment.courseId !== formData.courseId) {
            await updateEnrollmentCourseAction(currentEnrollment.id, formData.courseId);
          }
        } else {
          // Create new enrollment
          await createEnrollmentAction({
            studentId: user.id,
            courseId: formData.courseId,
            parentId: user.parentId || '',
          });
        }
      }

      onUserUpdated(result.user);
      onOpenChange(false);
    } else {
      alert(result.error || 'Failed to update user');
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{dictionary.users.editUser}</DialogTitle>
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
                placeholder="Leave empty to keep current password"
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

            {/* Show course selection for kids */}
            {user.role === ROLES.KID && courses.length > 0 && (
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked === true })
                }
              />
              <Label htmlFor="isActive">{dictionary.users.active}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {dictionary.common.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? dictionary.common.loading : dictionary.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
