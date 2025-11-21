'use server';

import { revalidatePath } from 'next/cache';
import {
  getAllEnrollments,
  findEnrollmentById,
  getEnrollmentsByStudentId,
  getEnrollmentsByParentId,
  getPendingPaymentsByParentId,
  createEnrollment,
  updateEnrollment,
  updatePaymentStatus,
  deleteEnrollment,
  type CreateEnrollmentInput,
  type Enrollment,
} from '../db/repositories/enrollmentRepository';
import { getCurrentUser } from '../auth/auth';
import { findUserById } from '../db/repositories/userRepository';
import { findCourseById } from '../db/repositories/courseRepository';

// Get all enrollments (admin only)
export async function getAllEnrollmentsAction() {
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }
  
  try {
    const enrollments = await getAllEnrollments();
    
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
  const user = await getCurrentUser();
  
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }
  
  // Parents can only see their own children's enrollments
  if (user.role === 'parent') {
    const student = await findUserById(studentId);
    if (!student || student.parentId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }
  }
  
  try {
    const enrollments = await getEnrollmentsByStudentId(studentId);
    
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
  const user = await getCurrentUser();
  
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }
  
  try {
    let enrollments: Enrollment[];
    
    if (user.role === 'admin') {
      enrollments = await getAllEnrollments();
    } else if (user.role === 'parent') {
      enrollments = await getEnrollmentsByParentId(user.id);
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
  const user = await getCurrentUser();
  
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }
  
  try {
    let enrollments: Enrollment[];
    
    if (user.role === 'admin') {
      const allEnrollments = await getAllEnrollments();
      enrollments = allEnrollments.filter(e => e.paymentStatus === 'pending');
    } else if (user.role === 'parent') {
      enrollments = await getPendingPaymentsByParentId(user.id);
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
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }
  
  try {
    // Validate student exists
    const student = await findUserById(input.studentId);
    if (!student || student.role !== 'kid') {
      return { success: false, error: 'Invalid student' };
    }
    
    // Validate course exists
    const course = await findCourseById(input.courseId);
    if (!course) {
      return { success: false, error: 'Invalid course' };
    }
    
    // Validate parent exists
    const parent = await findUserById(input.parentId);
    if (!parent || parent.role !== 'parent') {
      return { success: false, error: 'Invalid parent' };
    }
    
    const enrollment = await createEnrollment(input);
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
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'parent') {
    return { success: false, error: 'Unauthorized' };
  }
  
  try {
    const enrollment = await findEnrollmentById(enrollmentId);
    
    if (!enrollment) {
      return { success: false, error: 'Enrollment not found' };
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
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }
  
  try {
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
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }
  
  try {
    // Validate course exists
    const course = await findCourseById(courseId);
    if (!course) {
      return { success: false, error: 'Invalid course' };
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
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }
  
  try {
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
