import { getDatabase, generateId } from '../lmdb';
import { DEFAULT_ACADEMY_ID } from './academyRepository';

export interface Course {
  id: string;
  academyId: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  category?: string; // Course category (e.g., "Football", "Swimming", "Fitness")
  price: number;
  currency: string; // e.g., "USD", "SAR", "IQD"
  duration: number; // in months
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  courseImage?: string; // base64 image string
  coachId?: string; // ID of the assigned coach
  totalSessions?: number;
  sessionDays?: string[]; // e.g., ["Sunday", "Tuesday"]
  sessionStartTime?: string; // HH:mm
  sessionEndTime?: string; // HH:mm
  isActive: boolean;
  maxStudents?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseInput {
  academyId?: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  category?: string;
  price: number;
  currency?: string;
  duration: number;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  courseImage?: string; // base64 image string
  coachId?: string; // ID of the assigned coach
  totalSessions?: number;
  sessionDays?: string[];
  sessionStartTime?: string;
  sessionEndTime?: string;
  maxStudents?: number;
}

function normalizeCourseAcademy(course: Course | any, key?: string): Course {
  if (!course.academyId) {
    const normalized: Course = { ...course, academyId: DEFAULT_ACADEMY_ID };
    if (key) {
      const db = getDatabase();
      db.put(key, normalized);
    }
    return normalized;
  }

  return course as Course;
}

// Get all courses
export async function getAllCourses(): Promise<Course[]> {
  const db = getDatabase();
  const courses: Course[] = [];
  
  const range = db.getRange({ start: 'course:', end: 'course:\xFF' });
  
  for (const { key, value } of range) {
    const keyStr = String(key);
    if (keyStr.startsWith('course:') && value) {
      courses.push(normalizeCourseAcademy(value as Course, keyStr));
    }
  }
  
  return courses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getCoursesByAcademyId(academyId: string): Promise<Course[]> {
  const all = await getAllCourses();
  return all.filter((c) => c.academyId === academyId);
}

// Get active courses only
export async function getActiveCourses(): Promise<Course[]> {
  const allCourses = await getAllCourses();
  return allCourses.filter(course => course.isActive);
}

export async function getActiveCoursesByAcademyId(academyId: string): Promise<Course[]> {
  const allCourses = await getCoursesByAcademyId(academyId);
  return allCourses.filter((course) => course.isActive);
}

// Get courses assigned to a specific coach
export async function getCoursesByCoachId(coachId: string): Promise<Course[]> {
  if (!coachId) {
    return [];
  }

  const allCourses = await getAllCourses();
  return allCourses.filter(course => course.coachId === coachId);
}

export async function getCoursesByCoachIdAndAcademyId(coachId: string, academyId: string): Promise<Course[]> {
  const allCourses = await getCoursesByAcademyId(academyId);
  return allCourses.filter((course) => course.coachId === coachId);
}

// Get course by ID
export async function findCourseById(id: string): Promise<Course | null> {
  const db = getDatabase();
  const key = `course:${id}`;
  const course = db.get(key);
  return course ? normalizeCourseAcademy(course as Course, key) : null;
}

// Create new course
export async function createCourse(input: CreateCourseInput): Promise<Course> {
  const db = getDatabase();
  const id = generateId();
  
  const course: Course = {
    id,
    academyId: input.academyId || DEFAULT_ACADEMY_ID,
    name: input.name,
    nameAr: input.nameAr,
    description: input.description,
    descriptionAr: input.descriptionAr,
    category: input.category,
    price: input.price,
    currency: input.currency || 'USD',
    duration: input.duration,
    startDate: input.startDate,
    endDate: input.endDate,
    courseImage: input.courseImage,
    coachId: input.coachId,
    totalSessions: input.totalSessions,
    sessionDays: input.sessionDays,
    sessionStartTime: input.sessionStartTime,
    sessionEndTime: input.sessionEndTime,
    maxStudents: input.maxStudents,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  db.put(`course:${id}`, course);
  
  return course;
}

// Update course
export async function updateCourse(id: string, updates: Partial<CreateCourseInput & { isActive: boolean }>): Promise<Course | null> {
  const db = getDatabase();
  const existingCourse = await findCourseById(id);
  
  if (!existingCourse) {
    return null;
  }
  
  const updatedCourse: Course = {
    ...existingCourse,
    ...updates,
    academyId: (updates as any).academyId || existingCourse.academyId,
    updatedAt: new Date().toISOString(),
  };
  
  db.put(`course:${id}`, updatedCourse);
  
  return updatedCourse;
}

// Delete course
export async function deleteCourse(id: string): Promise<boolean> {
  const db = getDatabase();
  const course = await findCourseById(id);
  
  if (!course) {
    return false;
  }
  
  db.remove(`course:${id}`);
  return true;
}
