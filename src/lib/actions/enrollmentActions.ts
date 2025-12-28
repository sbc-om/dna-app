'use server';

import { revalidatePath } from 'next/cache';
import {
  getEnrollmentsByAcademyId,
  findEnrollmentById,
  getEnrollmentsByStudentIdAndAcademyId,
  getEnrollmentsByParentIdAndAcademyId,
  getPendingPaymentsByParentIdAndAcademyId,
  createEnrollment,
  updateEnrollment,
  updatePaymentStatus,
  deleteEnrollment,
  type CreateEnrollmentInput,
  type Enrollment,
} from '../db/repositories/enrollmentRepository';
import { requireAcademyContext, isAcademyAdmin } from '../academies/academyContext';
import { findUserById } from '../db/repositories/userRepository';
import { findCourseById } from '../db/repositories/courseRepository';

// Get all enrollments (admin only)
export async function getAllEnrollmentsAction() {
  const ctx = await requireAcademyContext('en');
  if (!isAcademyAdmin(ctx)) return { success: false, error: 'Unauthorized' };
  
  try {
    const enrollments = await getEnrollmentsByAcademyId(ctx.academyId);
    
    // Enrich enrollments with course and student details
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await findCourseById(enrollment.courseId);
        const student = await findUserById(enrollment.studentId);
        return {
          ...enrollment,
          course,
          student,
        };
      })
    );
    
    return { success: true, enrollments: enrichedEnrollments };
  } catch (error) {
    console.error('Error getting enrollments:', error);
    return { success: false, error: 'Failed to get enrollments' };
  }
}

// Get enrollments by student ID
export async function getEnrollmentsByStudentIdAction(studentId: string) {
  const ctx = await requireAcademyContext('en');
  const user = ctx.user;
  
  // Parents can only see their own children's enrollments
  if (user.role === 'parent') {
    const student = await findUserById(studentId);
    if (!student || student.parentId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }
  }
  
  try {
    const enrollments = await getEnrollmentsByStudentIdAndAcademyId(studentId, ctx.academyId);
    
    // Enrich enrollments with course details
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await findCourseById(enrollment.courseId);
        return {
          ...enrollment,
          course,
        };
      })
    );
    
    return { success: true, enrollments: enrichedEnrollments };
  } catch (error) {
    console.error('Error getting enrollments:', error);
    return { success: false, error: 'Failed to get enrollments' };
  }
}

// Get enrollments for current user (parent sees their children's enrollments)
export async function getMyEnrollmentsAction() {
  const ctx = await requireAcademyContext('en');
  const user = ctx.user;
  
  try {
    let enrollments: Enrollment[];
    
    if (isAcademyAdmin(ctx)) {
      enrollments = await getEnrollmentsByAcademyId(ctx.academyId);
    } else if (user.role === 'parent') {
      enrollments = await getEnrollmentsByParentIdAndAcademyId(user.id, ctx.academyId);
    } else {
      return { success: false, error: 'Unauthorized' };
    }
    
    // Enrich enrollments with course and student details
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await findCourseById(enrollment.courseId);
        const student = await findUserById(enrollment.studentId);
        return {
          ...enrollment,
          course,
          student,
        };
      })
    );
    
    return { success: true, enrollments: enrichedEnrollments };
  } catch (error) {
    console.error('Error getting enrollments:', error);
    return { success: false, error: 'Failed to get enrollments' };
  }
}

// Get pending payments for parent
export async function getPendingPaymentsAction() {
  const ctx = await requireAcademyContext('en');
  const user = ctx.user;
  
  try {
    let enrollments: Enrollment[];
    
    if (isAcademyAdmin(ctx)) {
      const allEnrollments = await getEnrollmentsByAcademyId(ctx.academyId);
      enrollments = allEnrollments.filter((e) => e.paymentStatus === 'pending');
    } else if (user.role === 'parent') {
      enrollments = await getPendingPaymentsByParentIdAndAcademyId(user.id, ctx.academyId);
    } else {
      return { success: false, error: 'Unauthorized' };
    }
    
    return { success: true, enrollments };
  } catch (error) {
    console.error('Error getting pending payments:', error);
    return { success: false, error: 'Failed to get pending payments' };
  }
}

// Create enrollment (admin only)
export async function createEnrollmentAction(input: CreateEnrollmentInput) {
  const ctx = await requireAcademyContext('en');
  if (!isAcademyAdmin(ctx)) return { success: false, error: 'Unauthorized' };
  
  try {
    // Validate student exists
    const student = await findUserById(input.studentId);
    if (!student || student.role !== 'player') {
      return { success: false, error: 'Invalid student' };
    }
    
    // Validate course exists
    const course = await findCourseById(input.courseId);
    if (!course) {
      return { success: false, error: 'Invalid course' };
    }

    if (course.academyId !== ctx.academyId) {
      return { success: false, error: 'Invalid course for current academy' };
    }
    
    // Validate parent exists
    const parent = await findUserById(input.parentId);
    if (!parent || parent.role !== 'parent') {
      return { success: false, error: 'Invalid parent' };
    }
    
    const enrollment = await createEnrollment({ ...input, academyId: ctx.academyId });
    revalidatePath('/[locale]/dashboard/enrollments');
    revalidatePath('/[locale]/dashboard/kids');
    return { success: true, enrollment };
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return { success: false, error: 'Failed to create enrollment' };
  }
}

// Upload payment proof (parent only)
export async function uploadPaymentProofAction(enrollmentId: string, proofUrl: string) {
  const ctx = await requireAcademyContext('en');
  const user = ctx.user;
  if (user.role !== 'parent') return { success: false, error: 'Unauthorized' };
  
  try {
    const enrollment = await findEnrollmentById(enrollmentId);
    
    if (!enrollment) {
      return { success: false, error: 'Enrollment not found' };
    }

    if (enrollment.academyId !== ctx.academyId) {
      return { success: false, error: 'Unauthorized' };
    }
    
    // Verify parent owns this enrollment
    if (enrollment.parentId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }
    
    // Store base64 directly in database (like profile picture)
    const updatedEnrollment = await updatePaymentStatus(enrollmentId, 'pending', proofUrl);
    
    revalidatePath('/[locale]/dashboard/payments');
    revalidatePath(`/[locale]/dashboard/payments/${enrollmentId}`);
    revalidatePath('/[locale]/dashboard/kids');
    return { success: true, enrollment: updatedEnrollment };
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    return { success: false, error: 'Failed to upload payment proof' };
  }
}

// Update payment status (admin only)
export async function updatePaymentStatusAction(
  enrollmentId: string,
  status: 'pending' | 'paid' | 'rejected',
  notes?: string
) {
  const ctx = await requireAcademyContext('en');
  if (!isAcademyAdmin(ctx)) return { success: false, error: 'Unauthorized' };
  
  try {
    const existing = await findEnrollmentById(enrollmentId);
    if (!existing) {
      return { success: false, error: 'Enrollment not found' };
    }
    if (existing.academyId !== ctx.academyId) {
      return { success: false, error: 'Unauthorized' };
    }

    const updates: any = {
      paymentStatus: status,
    };
    
    if (notes) {
      updates.notes = notes;
    }
    
    if (status === 'paid') {
      updates.paymentDate = new Date().toISOString();
    }
    
    const enrollment = await updateEnrollment(enrollmentId, updates);
    
    if (!enrollment) {
      return { success: false, error: 'Enrollment not found' };
    }
    
    revalidatePath('/[locale]/dashboard/enrollments');
    revalidatePath('/[locale]/dashboard/payments');
    revalidatePath('/[locale]/dashboard/payments/review/[enrollmentId]');
    return { success: true, enrollment };
  } catch (error) {
    console.error('Error updating payment status:', error);
    return { success: false, error: 'Failed to update payment status' };
  }
}

// Update enrollment course (admin only)
export async function updateEnrollmentCourseAction(enrollmentId: string, courseId: string) {
  const ctx = await requireAcademyContext('en');
  if (!isAcademyAdmin(ctx)) return { success: false, error: 'Unauthorized' };
  
  try {
    // Validate course exists
    const course = await findCourseById(courseId);
    if (!course) {
      return { success: false, error: 'Invalid course' };
    }

    if (course.academyId !== ctx.academyId) {
      return { success: false, error: 'Invalid course for current academy' };
    }

    const existing = await findEnrollmentById(enrollmentId);
    if (!existing) {
      return { success: false, error: 'Enrollment not found' };
    }
    if (existing.academyId !== ctx.academyId) {
      return { success: false, error: 'Unauthorized' };
    }
    
    const enrollment = await updateEnrollment(enrollmentId, { courseId });
    
    if (!enrollment) {
      return { success: false, error: 'Enrollment not found' };
    }
    
    revalidatePath('/[locale]/dashboard/enrollments');
    revalidatePath('/[locale]/dashboard/kids');
    revalidatePath('/[locale]/dashboard/users');
    return { success: true, enrollment };
  } catch (error) {
    console.error('Error updating enrollment course:', error);
    return { success: false, error: 'Failed to update enrollment course' };
  }
}

// Delete enrollment (admin only)
export async function deleteEnrollmentAction(id: string) {
  const ctx = await requireAcademyContext('en');
  if (!isAcademyAdmin(ctx)) return { success: false, error: 'Unauthorized' };
  
  try {
    const existing = await findEnrollmentById(id);
    if (!existing) {
      return { success: false, error: 'Enrollment not found' };
    }
    if (existing.academyId !== ctx.academyId) {
      return { success: false, error: 'Unauthorized' };
    }

    const deleted = await deleteEnrollment(id);
    
    if (!deleted) {
      return { success: false, error: 'Enrollment not found' };
    }
    
    revalidatePath('/[locale]/dashboard/enrollments');
    return { success: true };
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    return { success: false, error: 'Failed to delete enrollment' };
  }
}
