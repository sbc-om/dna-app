import { getDatabase, generateId } from '../lmdb';
import { DEFAULT_ACADEMY_ID } from './academyRepository';

export interface Enrollment {
  id: string;
  academyId: string;
  studentId: string;
  courseId: string;
  parentId: string;
  paymentStatus: 'pending' | 'paid' | 'rejected';
  enrollmentDate: string;
  paymentProofUrl?: string;
  paymentDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnrollmentInput {
  academyId?: string;
  studentId: string;
  courseId: string;
  parentId: string;
  notes?: string;
}

function normalizeEnrollmentAcademy(enrollment: Enrollment | any, key?: string): Enrollment {
  if (!enrollment.academyId) {
    const normalized: Enrollment = { ...enrollment, academyId: DEFAULT_ACADEMY_ID };
    if (key) {
      const db = getDatabase();
      db.put(key, normalized);
    }
    return normalized;
  }

  return enrollment as Enrollment;
}

// Get all enrollments
export async function getAllEnrollments(): Promise<Enrollment[]> {
  const db = getDatabase();
  const enrollments: Enrollment[] = [];
  
  const range = db.getRange({ start: 'enrollment:', end: 'enrollment:\xFF' });
  
  for (const { key, value } of range) {
    const keyStr = String(key);
    if (keyStr.startsWith('enrollment:') && value) {
      enrollments.push(normalizeEnrollmentAcademy(value as Enrollment, keyStr));
    }
  }
  
  return enrollments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getEnrollmentsByAcademyId(academyId: string): Promise<Enrollment[]> {
  const all = await getAllEnrollments();
  return all.filter((e) => e.academyId === academyId);
}

// Get enrollment by ID
export async function findEnrollmentById(id: string): Promise<Enrollment | null> {
  const db = getDatabase();
  const key = `enrollment:${id}`;
  const enrollment = db.get(key);
  return enrollment ? normalizeEnrollmentAcademy(enrollment as Enrollment, key) : null;
}

// Get enrollments by student ID
export async function getEnrollmentsByStudentId(studentId: string): Promise<Enrollment[]> {
  const allEnrollments = await getAllEnrollments();
  return allEnrollments.filter(e => e.studentId === studentId);
}

export async function getEnrollmentsByStudentIdAndAcademyId(studentId: string, academyId: string): Promise<Enrollment[]> {
  const allEnrollments = await getEnrollmentsByAcademyId(academyId);
  return allEnrollments.filter((e) => e.studentId === studentId);
}

// Get enrollments by parent ID
export async function getEnrollmentsByParentId(parentId: string): Promise<Enrollment[]> {
  const allEnrollments = await getAllEnrollments();
  return allEnrollments.filter(e => e.parentId === parentId);
}

export async function getEnrollmentsByParentIdAndAcademyId(parentId: string, academyId: string): Promise<Enrollment[]> {
  const allEnrollments = await getEnrollmentsByAcademyId(academyId);
  return allEnrollments.filter((e) => e.parentId === parentId);
}

// Get enrollments by course ID
export async function getEnrollmentsByCourseId(courseId: string): Promise<Enrollment[]> {
  const allEnrollments = await getAllEnrollments();
  return allEnrollments.filter(e => e.courseId === courseId);
}

export async function getEnrollmentsByCourseIdAndAcademyId(courseId: string, academyId: string): Promise<Enrollment[]> {
  const allEnrollments = await getEnrollmentsByAcademyId(academyId);
  return allEnrollments.filter((e) => e.courseId === courseId);
}

// Get paid enrollments by course ID
export async function getPaidEnrollmentsByCourseId(courseId: string): Promise<Enrollment[]> {
  const enrollments = await getEnrollmentsByCourseId(courseId);
  return enrollments.filter(e => e.paymentStatus === 'paid');
}

export async function getPaidEnrollmentsByCourseIdAndAcademyId(courseId: string, academyId: string): Promise<Enrollment[]> {
  const enrollments = await getEnrollmentsByCourseIdAndAcademyId(courseId, academyId);
  return enrollments.filter((e) => e.paymentStatus === 'paid');
}

// Get pending payments for parent
export async function getPendingPaymentsByParentId(parentId: string): Promise<Enrollment[]> {
  const enrollments = await getEnrollmentsByParentId(parentId);
  return enrollments.filter(e => e.paymentStatus === 'pending');
}

export async function getPendingPaymentsByParentIdAndAcademyId(parentId: string, academyId: string): Promise<Enrollment[]> {
  const enrollments = await getEnrollmentsByParentIdAndAcademyId(parentId, academyId);
  return enrollments.filter((e) => e.paymentStatus === 'pending');
}

// Create new enrollment
export async function createEnrollment(input: CreateEnrollmentInput): Promise<Enrollment> {
  const db = getDatabase();
  const id = generateId();
  
  const enrollment: Enrollment = {
    id,
    academyId: input.academyId || DEFAULT_ACADEMY_ID,
    studentId: input.studentId,
    courseId: input.courseId,
    parentId: input.parentId,
    paymentStatus: 'pending',
    enrollmentDate: new Date().toISOString(),
    notes: input.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  db.put(`enrollment:${id}`, enrollment);
  
  return enrollment;
}

// Update enrollment
export async function updateEnrollment(id: string, updates: Partial<Enrollment>): Promise<Enrollment | null> {
  const db = getDatabase();
  const existingEnrollment = await findEnrollmentById(id);
  
  if (!existingEnrollment) {
    return null;
  }
  
  const updatedEnrollment: Enrollment = {
    ...existingEnrollment,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  db.put(`enrollment:${id}`, updatedEnrollment);
  
  return updatedEnrollment;
}

// Update payment status
export async function updatePaymentStatus(
  id: string,
  status: 'pending' | 'paid' | 'rejected',
  paymentProofUrl?: string
): Promise<Enrollment | null> {
  const updates: Partial<Enrollment> = {
    paymentStatus: status,
  };
  
  if (paymentProofUrl) {
    updates.paymentProofUrl = paymentProofUrl;
  }
  
  if (status === 'paid') {
    updates.paymentDate = new Date().toISOString();
  }
  
  return updateEnrollment(id, updates);
}

// Delete enrollment
export async function deleteEnrollment(id: string): Promise<boolean> {
  const db = getDatabase();
  const enrollment = await findEnrollmentById(id);
  
  if (!enrollment) {
    return false;
  }
  
  db.remove(`enrollment:${id}`);
  return true;
}
