import { getDatabase } from '../lmdb';
import { DEFAULT_ACADEMY_ID } from './academyRepository';

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

const LEGACY_MEDALS_KEY = 'medals';
const LEGACY_STUDENT_MEDALS_KEY = 'studentMedals';

function medalsKey(academyId: string) {
  return `medals:${academyId}`;
}

function studentMedalsKey(academyId: string) {
  return `studentMedals:${academyId}`;
}

function ensureDefaultAcademyMigration<T>(newKey: string, legacyKey: string): T[] {
  const db = getDatabase();

  const existing = db.get(newKey);
  if (existing && Array.isArray(existing)) {
    return existing as T[];
  }

  const legacy = db.get(legacyKey);
  if (legacy && Array.isArray(legacy)) {
    db.put(newKey, legacy);
    return legacy as T[];
  }

  return [];
}

export function getAllMedals(academyId: string = DEFAULT_ACADEMY_ID): Medal[] {
  const db = getDatabase();

  if (academyId === DEFAULT_ACADEMY_ID) {
    return ensureDefaultAcademyMigration<Medal>(medalsKey(academyId), LEGACY_MEDALS_KEY);
  }

  const medals = db.get(medalsKey(academyId));
  return (medals as Medal[]) || [];
}

export function getActiveMedals(academyId: string = DEFAULT_ACADEMY_ID): Medal[] {
  const medals = getAllMedals(academyId);
  return medals.filter(m => m.isActive);
}

export function getMedalById(id: string, academyId: string = DEFAULT_ACADEMY_ID): Medal | null {
  const medals = getAllMedals(academyId);
  return medals.find(m => m.id === id) || null;
}

export function createMedal(medal: Omit<Medal, 'id' | 'createdAt'>, academyId: string = DEFAULT_ACADEMY_ID): Medal {
  const db = getDatabase();
  const medals = getAllMedals(academyId);
  
  const newMedal: Medal = {
    ...medal,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  
  medals.push(newMedal);
  db.put(medalsKey(academyId), medals);
  
  return newMedal;
}

export function updateMedal(
  id: string,
  updates: Partial<Omit<Medal, 'id' | 'createdAt'>>,
  academyId: string = DEFAULT_ACADEMY_ID
): Medal | null {
  const db = getDatabase();
  const medals = getAllMedals(academyId);
  
  const index = medals.findIndex(m => m.id === id);
  if (index === -1) return null;
  
  medals[index] = { ...medals[index], ...updates };
  db.put(medalsKey(academyId), medals);
  
  return medals[index];
}

export function deleteMedal(id: string, academyId: string = DEFAULT_ACADEMY_ID): boolean {
  const db = getDatabase();
  const medals = getAllMedals(academyId);
  
  const filtered = medals.filter(m => m.id !== id);
  if (filtered.length === medals.length) return false;
  
  db.put(medalsKey(academyId), filtered);
  return true;
}

// Student Medals
export function getAllStudentMedals(academyId: string = DEFAULT_ACADEMY_ID): StudentMedal[] {
  const db = getDatabase();

  if (academyId === DEFAULT_ACADEMY_ID) {
    return ensureDefaultAcademyMigration<StudentMedal>(studentMedalsKey(academyId), LEGACY_STUDENT_MEDALS_KEY);
  }

  const studentMedals = db.get(studentMedalsKey(academyId));
  return (studentMedals as StudentMedal[]) || [];
}

export function getStudentMedalsByStudent(studentId: string, academyId: string = DEFAULT_ACADEMY_ID): StudentMedal[] {
  const studentMedals = getAllStudentMedals(academyId);
  return studentMedals.filter(sm => sm.studentId === studentId);
}

export function getStudentMedalsByCourse(
  studentId: string,
  courseId: string,
  academyId: string = DEFAULT_ACADEMY_ID
): StudentMedal[] {
  const studentMedals = getAllStudentMedals(academyId);
  return studentMedals.filter(sm => sm.studentId === studentId && sm.courseId === courseId);
}

export function awardMedal(
  data: Omit<StudentMedal, 'id' | 'awardedAt'>,
  academyId: string = DEFAULT_ACADEMY_ID
): StudentMedal {
  const db = getDatabase();
  const studentMedals = getAllStudentMedals(academyId);
  
  const newAward: StudentMedal = {
    ...data,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    awardedAt: new Date().toISOString(),
  };
  
  studentMedals.push(newAward);
  db.put(studentMedalsKey(academyId), studentMedals);
  
  return newAward;
}

export function removeMedalFromStudent(id: string, academyId: string = DEFAULT_ACADEMY_ID): boolean {
  const db = getDatabase();
  const studentMedals = getAllStudentMedals(academyId);
  
  const filtered = studentMedals.filter(sm => sm.id !== id);
  if (filtered.length === studentMedals.length) return false;
  
  db.put(studentMedalsKey(academyId), filtered);
  return true;
}
