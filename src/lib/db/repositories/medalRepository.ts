import { getDatabase } from '../lmdb';

export interface Medal {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  points: number;
  icon: string; // Image URL or emoji
  createdAt: string;
  isActive: boolean;
}

export interface StudentMedal {
  id: string;
  studentId: string;
  medalId: string;
  courseId: string;
  attendanceId: string;
  awardedBy: string; // Coach user ID
  awardedAt: string;
  notes?: string;
}

const MEDALS_KEY = 'medals';
const STUDENT_MEDALS_KEY = 'studentMedals';

export function getAllMedals(): Medal[] {
  const db = getDatabase();
  const medals = db.get(MEDALS_KEY);
  return medals || [];
}

export function getActiveMedals(): Medal[] {
  const medals = getAllMedals();
  return medals.filter(m => m.isActive);
}

export function getMedalById(id: string): Medal | null {
  const medals = getAllMedals();
  return medals.find(m => m.id === id) || null;
}

export function createMedal(medal: Omit<Medal, 'id' | 'createdAt'>): Medal {
  const db = getDatabase();
  const medals = getAllMedals();
  
  const newMedal: Medal = {
    ...medal,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  
  medals.push(newMedal);
  db.put(MEDALS_KEY, medals);
  
  return newMedal;
}

export function updateMedal(id: string, updates: Partial<Omit<Medal, 'id' | 'createdAt'>>): Medal | null {
  const db = getDatabase();
  const medals = getAllMedals();
  
  const index = medals.findIndex(m => m.id === id);
  if (index === -1) return null;
  
  medals[index] = { ...medals[index], ...updates };
  db.put(MEDALS_KEY, medals);
  
  return medals[index];
}

export function deleteMedal(id: string): boolean {
  const db = getDatabase();
  const medals = getAllMedals();
  
  const filtered = medals.filter(m => m.id !== id);
  if (filtered.length === medals.length) return false;
  
  db.put(MEDALS_KEY, filtered);
  return true;
}

// Student Medals
export function getAllStudentMedals(): StudentMedal[] {
  const db = getDatabase();
  const studentMedals = db.get(STUDENT_MEDALS_KEY);
  return studentMedals || [];
}

export function getStudentMedalsByStudent(studentId: string): StudentMedal[] {
  const studentMedals = getAllStudentMedals();
  return studentMedals.filter(sm => sm.studentId === studentId);
}

export function getStudentMedalsByCourse(studentId: string, courseId: string): StudentMedal[] {
  const studentMedals = getAllStudentMedals();
  return studentMedals.filter(sm => sm.studentId === studentId && sm.courseId === courseId);
}

export function awardMedal(data: Omit<StudentMedal, 'id' | 'awardedAt'>): StudentMedal {
  const db = getDatabase();
  const studentMedals = getAllStudentMedals();
  
  const newAward: StudentMedal = {
    ...data,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    awardedAt: new Date().toISOString(),
  };
  
  studentMedals.push(newAward);
  db.put(STUDENT_MEDALS_KEY, studentMedals);
  
  return newAward;
}

export function removeMedalFromStudent(id: string): boolean {
  const db = getDatabase();
  const studentMedals = getAllStudentMedals();
  
  const filtered = studentMedals.filter(sm => sm.id !== id);
  if (filtered.length === studentMedals.length) return false;
  
  db.put(STUDENT_MEDALS_KEY, filtered);
  return true;
}
